import React, {
  createRef,
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useContext
} from 'react'
import {
  Tooltip,
  Popover,
  Form,
  Input,
  Button,
  Radio,
  Select,
  Space
} from 'antd'
import { PageContext, PageDispatchContext } from '../../env'
import { pageOption } from './formatting'
const { Option } = Select
const FormLayout = forwardRef(
  ({ cancel, submit, initValue }: any, ref: React.Ref<unknown> | undefined) => {
    const [form] = Form.useForm()
    const selectOp = [
      {
        text: '1,2,3',
        formatFunIndex: 0
      },
      {
        text: '-1-,-2-,-3-',
        formatFunIndex: 1
      },
      {
        text: ' 1 , 2 , 3 ',
        formatFunIndex: 2
      },
      {
        text: 'Page 1',
        formatFunIndex: 3
      },
      {
        text: 'First Page',
        formatFunIndex: 4
      },
      {
        text: 'Page 1 of x',
        formatFunIndex: 5
      },
      {
        text: 'First Page of x',
        formatFunIndex: 6
      }
    ]
    const radioOp = [
      {
        img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABkAgMAAABY7Z6ZAAAADFBMVEXi5u3////Axs89R1de/pOQAAAAO0lEQVQ4y2NYhQEYsAgtDUUDUXQQ+k+UUPwgFaJmSDCAAXWE6B+PDEiAUqFR14+6ftT1o0KDTIioWhQANqY3iwBuOv0AAAAASUVORK5CYII=',
        name: 'Left Align',
        value: 'left'
      },
      {
        img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABkAgMAAABY7Z6ZAAAADFBMVEXi5u3////Axs89R1de/pOQAAAAO0lEQVQ4y2NYhQEYsAgtDUUDUfQS+k+UUPwgFaJSSDCAAXWE6B+PDEiAUqFR14+6ftT1o0KDTIioWhQALnI3iwaTK+sAAAAASUVORK5CYII=',
        name: 'Center Align',
        value: 'center'
      },
      {
        img: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEgAAABkAgMAAABY7Z6ZAAAADFBMVEXi5u3////Axs89R1de/pOQAAAAO0lEQVQ4y2NYhQEYsAgtDUUDUfQV+k+UUPwgFaI4JBjAgDpC9I9HBiRAqdCo60ddP+r6UaFBJkRULQoAJJo3i/rbBzgAAAAASUVORK5CYII=',
        name: 'Right Align',
        value: 'right'
      }
    ]
    useImperativeHandle(ref, () => ({
      getFormData: () => {
        return form.getFieldsValue()
      }
    }))
    return (
      <>
        <Form initialValues={initValue} layout='horizontal' form={form}>
          <Form.Item name='formatFunIndex' label='Page Number Format'>
            <Select allowClear>
              {selectOp.map((item) => {
                return (
                  <Option key={item.text} value={item.formatFunIndex}>
                    {item.text}
                  </Option>
                )
              })}
            </Select>
          </Form.Item>
          <Form.Item label='Page Number Position' name='direction'>
            <Radio.Group>
              {radioOp.map((item) => {
                return (
                  <Radio key={item.name} value={item.value}>
                    <div>
                      <img src={item.img} alt='' />
                      <div style={{ textAlign: 'center' }}>{item.name}</div>
                    </div>
                  </Radio>
                )
              })}
            </Radio.Group>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={submit} type='primary'>
                Confirm
              </Button>
              <Button onClick={cancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </>
    )
  }
)

export default function PageHeader({ top, index, isHeader, all }: any) {
  const pageContext = useContext(PageContext)
  const dataKey = isHeader ? 'headerAttribute' : 'footerAttribute'
  const { dispatchPageInfo } = useContext(PageDispatchContext)
  const context = pageContext[dataKey]
  const direction = context.data.direction
  const [state, setState] = useState(() => {
    return {
      current: false,
      modelOpen: false
    }
  })
   // Create a ref for the Input component
   const inputRef = createRef<HTMLInputElement>(); // Reference to an HTML input element
   const refForm = useRef(null);
  const openButton = () => {
    setState({
      ...state,
      current: true
    })
  }
  const openInsert = () => {
    console.log('openInsert')
    setState({
      ...state,
      modelOpen: true
    })
  }

  const cancel = () => {
    console.log('cancel')
    setState({
      ...state,
      modelOpen: false
    })
  }
  const submit = () => {
    // Close the popup, insert or modify page number
    setState({
      ...state,
      modelOpen: false
    })
    // Update page number display
    syncContext(true)
  }
  const exit = () => {
    setState({
      ...state,
      current: false,
      modelOpen: false
    })
    syncContext()
  }
  const setText = (val: string) => {
    dispatchPageInfo({
      ...pageContext,
      [dataKey]: {
        ...context,
        value: val
      }
    })
  }
  const delInsert = () => {
    console.log('delete page number')
    dispatchPageInfo({
      ...pageContext,
      [dataKey]: {
        ...context,
        showPage: false
      }
    })
  }
  const syncContext = (showPage?: boolean) => {
    const formData = refForm.current && (refForm.current as any).getFormData()
    const obj = {
      ...context,
      data: formData || context.data,
      showPage: !!showPage || context.showPage
    }
    dispatchPageInfo({ ...pageContext, [dataKey]: obj })
  }
  const dialogContent = (
    <FormLayout
      cancel={cancel}
      ref={refForm}
      submit={submit}
      initValue={context.data}
    ></FormLayout>
  )
  const { current, modelOpen } = state
  const handleVisibleChange: (v: boolean) => void = (visible) => {
    console.log(visible, 'visible')
    setState({ ...state, modelOpen: !!visible })
  }
  const pageText = useMemo(() => {
    const findex = context.data.formatFunIndex
    const fn = pageOption[findex]
    const text = fn(index, all)
    console.log(text, 'is text')
    return text
  }, [index, all, context])
  useEffect(() => {
    if (current && inputRef.current) {
      inputRef.current.focus(); // Focus the input element
    }
  }, [current]);

  return (
    <div
      className='page-input-warp'
      style={{
        top: top
      }}
    >
      <Tooltip placement='top' title={state.current ? '' : 'Double-click to edit header'}>
        <div className='page-input-model'>
          <div className='header-com'>
            <span
              className='page-header-value'
              onDoubleClick={openButton}
              style={{ userSelect: 'none' }}
            >
              <Input
                // ref={inputRef}
                disabled={!state.current}
                bordered={false}
                value={context.value}
                onChange={(e) => {
                  setText(e.target.value)
                }}
              ></Input>
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              top: isHeader ? 40 + 'px' : -40 + 'px'
            }}
          >
            {state.current ? (
              <Space>
                <Popover
                  placement='topLeft'
                  content={dialogContent}
                  visible={modelOpen}
                  trigger='click'
                  onVisibleChange={handleVisibleChange}
                >
                  <Button onClick={openInsert}>
                    {context.showPage ? 'Page Number Settings' : 'Insert Page Number'}
                  </Button>
                </Popover>
                {context.showPage ? (
                  <Button onClick={delInsert}>Delete Page Number</Button>
                ) : null}
                <Button onClick={exit}>Exit Edit</Button>
              </Space>
            ) : null}
          </div>
          {context.showPage ? (
            <div
              className='page-header-page-text'
              style={{ textAlign: direction }}
            >
              {pageText}
            </div>
          ) : null}
        </div>
      </Tooltip>
    </div>
  )
}
