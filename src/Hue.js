import React, { useRef, useEffect } from "react"
import { usePicker } from "./context"
import throttle from "lodash.throttle"
import usePaintHue from "./usePaintHue"
import { Handle, BarCanvas, BarWrapper, CanvasWrapper } from './components'

const Hue = () => {
  const bar = useRef(null)
  const canvas = useRef(null)
  const { handleHue, offsetLeft } = usePicker()

  usePaintHue(canvas)

  useEffect(() => {
    const onMouseMove = throttle(e => {
      handleHue(e)
    }, 150)

    function onMouseUp(e) {
      handleHue(e)
      document.body.removeEventListener("mousemove", onMouseMove)
      document.body.removeEventListener("mouseup", onMouseUp)
    }

    function onMouseDown(e) {
      document.body.addEventListener("mousemove", onMouseMove)
      document.body.addEventListener("mouseup", onMouseUp)
    }

    const barRef = bar.current
    barRef.addEventListener("mousedown", onMouseDown)

    return () => {
      barRef.removeEventListener("mousedown", onMouseDown)
      document.body.removeEventListener("mousemove", onMouseMove)
      document.body.removeEventListener("mouseup", onMouseUp)
    }
  }, [handleHue, offsetLeft])

  return (
    <BarWrapper reffy={bar}>
      <Handle type='hue' />
      <CanvasWrapper height={14}>
        <BarCanvas ref={canvas} />
      </CanvasWrapper>
    </BarWrapper>
  )
}

export default Hue