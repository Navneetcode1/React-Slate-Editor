interface pageStyleFunc {
  (index: number, all: number): string
}

export const pageOption: pageStyleFunc[] = [
  (index) => {
    return index + ''
  },
  (index) => {
    return `-${index}-`
  },
  (index) => {
    return ` ${index} `
  },
  (index) => {
    return `Page ${index}`
  },
  (index) => {
    return `Page ${number2text(index)}`
  },
  (index, all) => {
    return `Page ${index} of ${all}`
  },
  (index, all) => {
    return `Page ${number2text(index)} of ${number2text(all)}`
  }
]


const number2text = (
  number: Number | String,
  type: 'lower' | 'upper' = 'lower'
) => {
  const confs = {
    lower: {
      num: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'],
      unit: ['', 'Ten', 'Hundred', 'Thousand', 'Ten Thousand'],
      level: ['', 'Ten Thousand', 'Hundred Million']
    },
    upper: {
      num: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'],
      unit: ['', 'Ten', 'Hundred', 'Thousand'],
      level: ['', 'Ten Thousand', 'Hundred Million']
    },
    maxNumber: 999999999999
  }

  if (Number(number) > confs.maxNumber) {
    console.error(
      `The maxNumber is ${confs.maxNumber}. ${number} is bigger than it!`
    )
    return false
  }

  const conf = confs[type]
  const integer = String(Number(number)).split('')

  const levels = integer.reverse().reduce((pre: any, item: any, idx) => {
    let level = pre[0] && pre[0].length < 4 ? pre[0] : []
    let value =
      item === '0' ? conf.num[item] : conf.num[item] + conf.unit[idx % 4]
    level.unshift(value)

    if (level.length === 1) {
      pre.unshift(level)
    } else {
      pre[0] = level
    }

    return pre
  }, [])

 
  const _integer = levels.reduce(
    (pre: String, item: Array<number>, idx: number) => {
      let _level = conf.level[levels.length - idx - 1]
      let _item = item.join('').replace(/(Zero)\1+/g, '$1') 

      if (_item === 'Zero') {
        _item = ''
        _level = ''

      } else if (_item[_item.length - 1] === 'Zero') {
        _item = _item.slice(0, _item.length - 1)
      }

      return pre + _item + _level
    },
    ''
  )

  return `${_integer}`
}
