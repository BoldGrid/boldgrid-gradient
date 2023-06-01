import React from 'react'
import { usePicker } from '../context'

const Presets = ({ presets = [] }) => {
  const { value, handlePresetChange, squareSize } = usePicker()
  
  return (
    <div
      style={{
        display: 'flex',
        marginTop: 14,
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          background: value,
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: squareSize - 66,
          justifyContent: 'space-between',
        }}
      >
        {
          Object.keys( presets ).map( ( key, index ) => (
            <div
            key={key}
            data-preset={key}
            style={{
              height: 23,
              width: '10.2%',
              borderRadius: 4,
              background: presets[key],
              marginBottom: 2,
              border: '1px solid #96959c',
            }}
            onClick={() => handlePresetChange(key, presets[key])}
          />
          ))}
      </div>
    </div>
  )
}

export default Presets
