import { createRoot } from 'react-dom/client'
import { createElement } from 'react'
import { Agentation } from 'agentation'

const container = document.createElement('div')
document.body.appendChild(container)
createRoot(container).render(createElement(Agentation))
