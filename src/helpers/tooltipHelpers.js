
export const isTooltipBottom = (value) => value < 20
export const isTooltipRight = (value) => value < 20
export const isTooltipLeft = (value) => value > 80
export const isTooltipCenter = (value) => value >= 20 && value <= 80

export const getTooltipYClasses = (value) => {
  return isTooltipBottom(value)
    ? 'tw-top-0 tw-pt-[30px]'
    : '-tw-top-[154px] tw-pb-[54px]'
}

export const getTooltipXClasses = (value) => {
  if (isTooltipRight(value)) return 'tw-left-0 tw-translate-x-0'
  if (isTooltipLeft(value)) return 'tw-left-0 -tw-translate-x-full'
  return 'tw-left-0 -tw-translate-x-1/2'
}
