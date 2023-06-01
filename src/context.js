import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  computePickerPosition,
  getGradientType,
  computeSquareXY,
  getDegrees,
  getNewHsl,
  getHandleValue,
  isUpperCase,
  compareGradients,
} from './utils/utils'
import { low, high, getColors } from './utils/formatters'
import { config } from './constants'

var tinycolor = require('tinycolor2')
const { crossSize } = config
const PickerContext = createContext()

export default function PickerContextWrapper({
  children,
  bounds,
  value,
  gradientObj,
  rawValue,
  target,
  onChange,
  squareSize,
  squareHeight,
  hideOpacity
}) {
  const offsetLeft = bounds?.x
  const isGradient = value?.includes('gradient')
  const gradientType = getGradientType(value)
  const degrees = getDegrees(value)
  const degreeStr =
    gradientType === 'linear-gradient' ? `${degrees}deg` : 'circle'
  const colors = getColors(value, target, gradientObj )
  const indexedColors = colors?.map((c, i) => ({ ...c, index: i }))
  const currentColorObj =
    indexedColors?.filter((c) => isUpperCase(c.value))[0] || indexedColors[0]
  const currentColor = currentColorObj?.value
  const selectedColor = currentColorObj?.index
  const currentLeft = currentColorObj?.left
  const [tinyColor, setTinyColor] = useState(tinycolor(currentColor))
  const [inputType, setInputType] = useState('rgb')

  const { r, g, b, a: opacity } = tinyColor.toRgb()
  const { h, s, l } = tinyColor.toHsl()
  const { s: hsvS, v: hsvV } = tinyColor.toHsv()
  const [internalHue, setInternalHue] = useState(Math.round(h))
  const hue = Math.round(h)
  const [x, y] = computeSquareXY([hue, s, l], squareSize, squareHeight)
  const [previousColors, setPreviousColors] = useState([])
  const [previousGraidents, setPreviousGradients] = useState([])
  const [inFocus, setInFocus] = useState(null)
  // const [undoLog, setUndoLog] = useState(0)

  const internalOnChange = (newValue) => {
    if (newValue !== value) {
      if (isGradient) {
        if (!compareGradients(previousGraidents[0], value)) {
          setPreviousGradients([value, ...previousGraidents?.slice(0, 8)])
        }
      } else {
        setPreviousColors([value, ...previousColors?.slice(0, 8)])
      }

      onChange( { newValue, gradientObj, degreeStr, gradientType } )
    }
  }

  useEffect(() => {
    setTinyColor(tinycolor(currentColor))
    setInternalHue(hue)
  }, [currentColor, hue])

  const createGradientStr = (newColors) => {
    let sorted = newColors.sort((a, b) => a.left - b.left)
    let colorString = sorted?.map( createColorStr );
    internalOnChange(`${gradientType}(${degreeStr}, ${colorString.join(', ')})`)
  }

  const createColorStr = (colorObj) => {
    let colorStr = `${colorObj?.value} ${colorObj.left}%`
    if ( colorObj?.variable ) {
      let colorValue = colorObj.value.toLowerCase();
      colorStr = `var(--${colorObj.variable}) ${colorObj.left}%`

      let variableComputedColor = getComputedStyle( target.get( 0 ) ).getPropertyValue( '--' + colorObj.variable );

      if( isTranslucentVariable( colorValue, variableComputedColor ) ) {
        let opacity = getOpacityFromRgba( colorValue );
        colorStr = `rgba(var(--${colorObj.variable}-raw), ${opacity}) ${colorObj.left}%`
      }
    }

    return colorStr;
  }

  const getOpacityFromRgba = ( rgba ) => {
    let opacity = rgba.split( ',' ).pop();
    opacity = opacity.replace( ')', '' );
    opacity = opacity.replace( ' ', '' );
    return opacity;
  }

  /**
   * Converts both values from rba to rgb
   * and compares to see if they are the same.
   * 
   * @param {string} colorValue 
   * @param {string} variableComputedColor 
   * 
   * @returns {boolean} isTranslucentVariable
   */
  const isTranslucentVariable = ( colorValue, variableComputedColor ) => {
    if ( colorValue === variableComputedColor ) {
      return false;
    }
    let colorValueRGB = tinycolor( colorValue ).setAlpha( 1 ).toRgbString();
    let variableComputedColorRGB = tinycolor( variableComputedColor ).setAlpha( 1 ).toRgbString();
    let isTranslucentVariable = colorValueRGB === variableComputedColorRGB;

    return isTranslucentVariable;
  }

  const handleGradient = (newColor, left = currentLeft, presetId = null ) => {
    let remaining = colors?.filter((c) => !isUpperCase(c.value))
    let newColorsValue = { value: newColor.toUpperCase(), left: left };
    let isValueVariable = newColor.toLowerCase().includes( 'var(' );
    if ( presetId ) {
      let value = isValueVariable 
        ? getComputedStyle( target.get( 0 ) ).getPropertyValue( '--' + presetId )
        : newColor;
      newColorsValue = { value: value.toUpperCase(), left: left, variable: presetId }
    } 

    let newColors = [
      newColorsValue,
      ...remaining,
    ]
  
    gradientObj = newColors;
    createGradientStr(newColors)
  }

  const handlePresetChange = ( presetId, presetColor ) => {
    let newColor = presetColor
    if (isGradient) {
      handleGradient(newColor, currentLeft, presetId )
    } else {
      internalOnChange(newColor)
    }
  }

  const handleChange = (newColor) => {
    if (isGradient) {
      handleGradient(newColor)
    } else {
      internalOnChange(newColor)
    }
  }

  const handleOpacity = (e) => {
    let newO = getHandleValue(e) / 100
    let newColor = `rgba(${r}, ${g}, ${b}, ${newO})`
    if ( isGradient && currentColorObj?.variable ) {
      handleGradient(newColor, currentLeft, currentColorObj?.variable )
    } else {
      handleChange(newColor)
    }
    
  }

  const handleHue = (e) => {
    let newHue = getHandleValue(e) * 3.6
    let newHsl = getNewHsl(newHue, s, l, opacity, setInternalHue)
    handleChange(newHsl)
  }

  const handleColor = (e, ctx) => {
    const [x, y] = computePickerPosition(e, squareHeight)
    const x1 = Math.min(x + crossSize / 2, squareSize - 1)
    const y1 = Math.min(y + crossSize / 2, squareHeight - 1)
    const [r, g, b] = ctx.getImageData(x1, y1, 1, 1).data
    let newColor = `rgba(${r}, ${g}, ${b}, ${opacity})`
    handleChange(newColor)
  }

  const setSelectedColor = (index) => {
    let newGradStr = colors?.map((cc, i) => ({
      ...cc,
      value: i === index ? high(cc) : low(cc),
    }))
    createGradientStr(newGradStr)
  }

  const addPoint = (e) => {
    let left = getHandleValue(e, offsetLeft)
    let newColors = [
      ...colors.map((c) => ({ ...c, value: low(c) })),
      { value: currentColor, left: left },
    ]?.sort((a, b) => a.left - b.left)
    createGradientStr(newColors)
  }

  const deletePoint = () => {
    if (colors?.length > 2) {
      let formatted = colors?.map((fc, i) => ({
        ...fc,
        value: i === selectedColor - 1 ? high(fc) : low(fc),
      }))
      let remaining = formatted?.filter((rc, i) => i !== selectedColor)
      createGradientStr(remaining)
    }
  }

  const nextPoint = () => {
    if (selectedColor !== colors?.length - 1) {
      setSelectedColor(selectedColor + 1)
    }
  }


  useEffect(() => {
    window.addEventListener('click', handleClickFocus)
    // window.addEventListener('keydown', handleKeyboard)

    return () => {
      window.removeEventListener('click', handleClickFocus)
      // window.removeEventListener('keydown', handleKeyboard)
    }
  }, [inFocus, value])

  const handleClickFocus = (e) => {
    let formattedPath = e?.path?.map((el) => el.id)

    if (formattedPath?.includes('gradient-bar')) {
      setInFocus('gpoint')
    } else if (formattedPath?.includes('rbgcp-input')) {
      setInFocus('input')
    } else if (formattedPath?.includes('rbgcp-wrapper')) {
      setInFocus('picker')
    } else {
      setInFocus(null)
    }
  }

  const pickerState = {
    x,
    y,
    s,
    l,
    r,
    g,
    b,
    hue,
    hsvS,
    hsvV,
    value,
    colors,
    degrees,
    inFocus,
    opacity,
    onChange,
    addPoint,
    inputType,
    nextPoint,
    tinyColor,
    handleHue,
    setInFocus,
    isGradient,
    offsetLeft,
    squareSize,
    hideOpacity,
    handleColor,
    currentLeft,
    deletePoint,
    internalHue,
    squareHeight,
    setInputType,
    gradientType,
    handleChange,
    handlePresetChange,
    currentColor,
    target,
    selectedColor,
    gradientObj,
    handleOpacity,
    setInternalHue,
    previousColors,
    handleGradient,
    setSelectedColor,
    internalOnChange,
    previousGraidents,
  }

  return (
    <PickerContext.Provider value={pickerState}>
      {children}
    </PickerContext.Provider>
  )
}

export function usePicker() {
  return useContext(PickerContext)
}
