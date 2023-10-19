import '@grapecity/wijmo.styles/wijmo.css';
import './styles.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Map } from './map'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(<Map></Map>)