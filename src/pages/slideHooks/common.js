import bus from "../../utils/bus";
import Utils from '../../utils'
import GM from "../../utils";
import {SlideType} from "../../utils/const_var";


export function slideTouchStart(e, el, state) {
  GM.$setCss(el, 'transition-duration', `0ms`)
  state.start.x = e.touches[0].pageX
  state.start.y = e.touches[0].pageY
  state.start.time = Date.now()
}

export function canSlide(state, judgeValue, type = SlideType.HORIZONTAL) {
  if (state.needCheck) {
    if (Math.abs(state.move.x) > judgeValue || Math.abs(state.move.y) > judgeValue) {
      let angle = (Math.abs(state.move.x) * 10) / (Math.abs(state.move.y) * 10)
      state.next = type === SlideType.HORIZONTAL ? angle > 1 : angle <= 1;
      // console.log(angle)
      state.needCheck = false
    } else {
      return false
    }
  }
  return state.next
}

export function slideTouchMove(e, el, state, judgeValue, cb, type = SlideType.HORIZONTAL) {
  state.move.x = e.touches[0].pageX - state.start.x
  state.move.y = e.touches[0].pageY - state.start.y

  let isNext = type === SlideType.HORIZONTAL ? state.move.x < 0 : state.move.y < 0

  if (!cb?.(isNext)) return

  if (canSlide(state, judgeValue, type)) {
    bus.emit(state.name + '-moveX', state.move.x)
    GM.$stopPropagation(e)
    let t = getSlideDistance(state, type) + (isNext ? judgeValue : -judgeValue)
    let dx1 = 0
    let dx2 = 0
    if (type === SlideType.HORIZONTAL) {
      dx1 = t + state.move.x
    } else {
      dx2 = t + state.move.y
    }
    GM.$setCss(el, 'transform', `translate3d(${dx1}px, ${dx2}px, 0)`)
  }
}

export function slideTouchEnd(e, state, canNextCb, nextCb, type = SlideType.HORIZONTAL) {
  let isHorizontal = type === SlideType.HORIZONTAL;
  let isNext = isHorizontal ? state.move.x < 0 : state.move.y < 0

  if (!canNextCb?.(isNext)) return
  if (state.next) {
    GM.$stopPropagation(e)
    let endTime = Date.now()
    let gapTime = endTime - state.start.time
    let distance = isHorizontal ? state.move.x : state.move.y
    let judgeValue = isHorizontal ? state.wrapper.width : state.wrapper.height
    if (Math.abs(distance) < 20) gapTime = 1000
    if (Math.abs(distance) > (judgeValue / 3)) gapTime = 100
    if (gapTime < 150) {
      if (isNext) {
        state.localIndex++
      } else {
        state.localIndex--
      }
      nextCb?.()
    }
  }
}

export function slideReset(el, state, type, emit) {
  Utils.$setCss(el, 'transition-duration', `300ms`)
  let t = getSlideDistance(state, type)
  let dx1 = 0
  let dx2 = 0
  if (type === SlideType.HORIZONTAL) {
    dx1 = t
  } else {
    dx2 = t
  }
  GM.$setCss(el, 'transform', `translate3d(${dx1}px, ${dx2}px, 0)`)
  state.start.x = state.start.y = state.start.time = state.move.x = state.move.y = 0
  state.next = false
  state.needCheck = true
  emit('update:index', state.localIndex)
  bus.emit(state.name + '-end', state.localIndex)
}

export function getSlideDistance(state, type = SlideType.HORIZONTAL) {
  if (type === SlideType.HORIZONTAL) {
    return -state.localIndex * state.wrapper.width
  } else {
    return -state.localIndex * state.wrapper.height
  }
}