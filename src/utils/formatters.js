import { config } from '../constants'
import { gradientParser } from './gradientParser'

const { defaultColor, defaultGradient } = config

export const low = (color) => {
  return color.value.toLowerCase()
}

export const high = (color) => {
  return color.value.toUpperCase()
}

export const sanitizeColorVars = (value, target) => {
  var failures = 0;
  const targetComputedStyle = getComputedStyle( target.get( 0 ) );
  const sanitizedValue      = value.replace( /(var\(--[\w|\-|\d]+\))/ig, ( match ) => {
    const variable      = match.replace( /var\(/ig, '' ).replace( /\)/ig, '' );
    const variableValue = targetComputedStyle.getPropertyValue( variable );
    if ( ! variableValue ) {
      failures++;
    }
    return variableValue;
  } );

  return failures ? config.defaultGradient : sanitizedValue;
}

export const getColors = (value, target = null, gradientObj ) => {
  let isGradient    = value?.includes('gradient')
  let usesColorVars = value?.includes( 'var(' )

  if ( isGradient && usesColorVars && ! gradientObj ) {
    value = sanitizeColorVars( value, target );
  }

  if ( isGradient && gradientObj && gradientObj.length > 0 ) {
    return gradientObj;
  }

  if (isGradient) {
    let isConic = value?.includes('conic')
    let safeValue = !isConic && validate(value) ? value : defaultGradient
    if (isConic) {
      console.log('Sorry we cant handle conic gradients yet')
    }
    var obj = gradientParser(safeValue, target )
    return obj?.colorStops
  } else {
    let safeValue = validate(value) ? value : defaultColor
    return [{ value: safeValue }]
  }
}

let validate = (c) => {
  // let img = window?.document?.createElement('img')
  // img.style = 'background: rgb(0, 0, 0)'
  // img.style = 'background: ' + c
  // if (img.style.background !== 'rgb(0, 0, 0)' && img.style.background !== '')
  //   return true
  // img.style = 'background: rgb(255, 255, 255)'
  // img.style = 'background: ' + c
  // return (
  //   img.style.background !== 'rgb(255, 255, 255)' && img.style.background !== ''
  // )
  return true
}

export const formatInputValues = (value, min, max) => {
  return isNaN(value) ? min : value < min ? min : value > max ? max : value
}
