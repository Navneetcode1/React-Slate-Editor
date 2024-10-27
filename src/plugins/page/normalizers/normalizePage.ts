import { Transforms, Element, Node, Editor, Path, NodeEntry } from 'slate'
import { ReactEditor } from 'slate-react'
import { SPEditor } from '@udecode/plate-core'

const emptyPage = {
  type: 'page',
  children: []
}

const matchTag = ['h1', 'h2', 'p', 'ul', 'ol', 'table']
const dirtyNodes: Set<any> = new Set()
let asyncPromise = Promise.resolve()
let isPageNormalize = false

const setTimeRunClearn = (() => {
  let timer: null | Number
  return () => {
    if (!timer) {
      timer = setTimeout(() => {
        isPageNormalize = false
        dirtyNodes.clear()
        timer = null
      })
    }
  }
})()

const heightWeakMap = new WeakMap()



export const normalizePage = (editor: ReactEditor & SPEditor) => {
  const { normalizeNode } = editor
  return (entry: any) => {
    let [node, path] = entry
    if (Element.isElement(node) && (node as any).type === 'page') {
      if (!isPageNormalize && !dirtyNodes.size) {
       
        asyncPromise.then(() => {
          computeRun(editor)
        })
      }
      if (!isPageNormalize) {
        if (!dirtyNodes.size) {
          const [prevNode] =
            Editor.previous(editor, {
              at: path
            }) || []
          if (prevNode) {
            !dirtyNodes.has(prevNode) && dirtyNodes.add(prevNode)
          }
        }
        !dirtyNodes.has(node) && dirtyNodes.add(node)
      }
      return
    }

    return normalizeNode(entry)
  }
}

const computeRun = (editor: any) => {
  setTimeRunClearn()
  isPageNormalize = true
  let pageNode: any
  console.time('while 循环')
  while (dirtyNodes.size) {
    const dirtyNodesArr = Array.from(dirtyNodes)
    pageNode = dirtyNodesArr.shift()
    dirtyNodes.delete(pageNode)
    const pageElement = getDom(editor, pageNode)
    const path = getPath(editor, pageNode)
    if (!path || !pageElement) {
      break
    }
    const nextPagePath = [path[0] + 1]
    let nextPageNodeEntry: NodeEntry<Node> | undefined
    try {
      nextPageNodeEntry = Editor.node(editor, nextPagePath) 
    } catch (error) {
      console.log(nextPagePath, '')
    }
    const nextPageNode: any = nextPageNodeEntry && nextPageNodeEntry[0]
    const hasNextPage = !!nextPageNode 
    let countPageHeight = 0
    
    const pageHeight = getPageHeight(pageElement)
    if (heightWeakMap.get(pageNode)) {
      console.error('eror')
      countPageHeight = heightWeakMap.get(pageNode)
    } else {
      console.log('error')
      const {
        isOverStep,
        index: overIndex,
        countPageHeight: newCountPageHeight
      } = getElementChildHeight(pageElement, countPageHeight, pageHeight)
      countPageHeight = newCountPageHeight
      if (isOverStep && overIndex) {
        if (hasNextPage && nextPagePath) {
          moveChildToNextPage(editor, overIndex, path, nextPagePath)
          updateDirtyNode(editor, nextPagePath)
          break
        } else {
          createPageAndMove(editor, overIndex, path, pageNode)
          break
        }
      }
      heightWeakMap.set(pageNode, countPageHeight)
    }

    const prevPageNeedFill =
      countPageHeight < pageHeight &&
      hasNextPage &&
      nextPagePath &&
      nextPageNode
    if (prevPageNeedFill) {
      let empytHeiht = pageHeight - countPageHeight
      let nextPageElement = getDom(editor, nextPageNode)
      if (!nextPageElement) {
        break
      }
      const nextPageChildren = Array.from(nextPageElement.children)
      let preElementBottomMargin = 0
      for (let index = 0; index < nextPageChildren.length; index++) {
        const nextPageChildNode = nextPageChildren[index]
        const { height: childHeight, marginBottom } = computeItemHeight(
          nextPageChildNode,
          preElementBottomMargin
        )
        preElementBottomMargin = marginBottom
        if (empytHeiht < childHeight) break
        empytHeiht = empytHeiht - childHeight
        const toPath = path.concat([pageNode.children.length])
        debugger
        riseElementToPrevPage(editor, index, nextPagePath, toPath)
        if (index === nextPageChildren.length - 1) {
          Transforms.removeNodes(editor, {
            at: nextPagePath
          })
        }
      }
    }
  }
  console.timeEnd('while ends navneet')
}


function updateDirtyNode(editor: ReactEditor & SPEditor, path: any) {
  Promise.resolve()
    .then(() => {
      let nextPageNodeEntry: NodeEntry<Node> | undefined
      try {
        nextPageNodeEntry = Editor.node(editor, path) 
      } catch (error) {
        console.error(error)
      }
      const nextPageNode = nextPageNodeEntry && nextPageNodeEntry[0]
      !dirtyNodes.has(nextPageNode) && dirtyNodes.add(nextPageNode)
      return Promise.resolve()
    })
    .then(() => {
      computeRun(editor)
    })
}

function getElementChildHeight(
  element: HTMLElement,
  countPageHeight: number,
  pageHeight: number
) {
  const children: globalThis.Element[] = Array.from(element.children)
  // top bottom margin merge
  let preElementBottomMargin = 0
  for (let index = 0; index < children.length; index++) {
    const child = children[index]
    const { height: childHeight, marginBottom } = computeItemHeight(
      child,
      preElementBottomMargin
    )
    preElementBottomMargin = marginBottom
    countPageHeight = countPageHeight + childHeight
    if (countPageHeight > pageHeight) {
      return { isOverStep: true, index, countPageHeight }
    }
  }
  return { isOverStep: false, countPageHeight }
}


function getPath(editor: ReactEditor & SPEditor, node: Node) {
  let path
  try {
    path = ReactEditor.findPath(editor, node)
  } catch (error) {
    console.log(error)
  }
  return path
}

function getDom(editor: ReactEditor & SPEditor, node: Node) {
  let nodeElement
  try {
    nodeElement = ReactEditor.toDOMNode(editor, node)
  } catch (error) {
    console.error('DOM 转换失败', error)
  }
  return nodeElement
}

function getPageHeight(PageNode: HTMLElement) {
  const style = window.getComputedStyle(PageNode)
  const computedHeight = PageNode.offsetHeight
  const padding =
    parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0')

  const pageHeight = computedHeight - padding
  return pageHeight
}

function computeItemHeight(
  dom: globalThis.Element,
  mergeMargin: number
): {
  height: number
  marginBottom: number
} {
  const style = window.getComputedStyle(dom)
  const clientHeight = dom.clientHeight
  const marginTop = parseFloat(style.marginBottom)
  const mergeMarginVal = Math.max(marginTop - mergeMargin, 0)
  const marginBottom = parseFloat(style.marginBottom)
  const margin = mergeMarginVal + marginBottom
  const padding = parseFloat(style.paddingBottom) + parseFloat(style.paddingTop)
  const border =
    parseFloat(style.borderLeftWidth) +
    parseFloat(style.borderRightWidth) +
    parseFloat(style.borderTopWidth) +
    parseFloat(style.borderBottomWidth)

  const height = clientHeight + margin + padding + border
  return { height, marginBottom: marginBottom }
}

function moveChildToNextPage(
  editor: ReactEditor,
  splitIndex: number,
  formPath: Path,
  toPath: Path
): void {
  console.log('moveChildToNextPage')
  let nodePathIndex = 0
  Transforms.moveNodes(editor, {
    at: formPath,
    match(n) {
      if (
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        matchTag.includes((n as any).type)
      ) {
        return nodePathIndex++ >= splitIndex
      }
      return false
    },
    to: toPath.concat([0])
  })
}

function createPageAndMove(
  editor: ReactEditor,
  splitIndex: number,
  formPath: Path,
  entryNode: Node
) {
  console.log('createPageAndMove')
  let nodePathIndex = 0
  Transforms.wrapNodes(editor, emptyPage, {
    at: formPath,
    split: true,
    match(n) {
      if (
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        matchTag.includes((n as any).type)
      ) {
        return nodePathIndex++ >= splitIndex
      }
      return false
    }
  })
  Transforms.moveNodes(editor, {
    at: formPath,
    match(n) {
      if (
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        (n as any).type === 'page' &&
        n !== entryNode
      ) {
        return true
      }
      return false
    },
    to: [formPath[0] + 1]
  })
}

function riseElementToPrevPage(
  editor: ReactEditor,
  splitIndex: number,
  formPath: Path,
  toPath: Path
) {
  console.log('riseElementToPrevPage')
  Transforms.moveNodes(editor, {
    at: formPath,
    match(n) {
      if (
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        matchTag.includes((n as any).type) &&
        (n as any).type !== 'page'
      ) {
        let path
        try {
          path = ReactEditor.findPath(editor, n)
        } catch (error) {
          return false
        }
        return path[1] <= splitIndex
      }
      return false
    },
    to: toPath 
  })
}
