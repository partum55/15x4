'use client'

import { configureBoneyard } from 'boneyard-js/react'
import '../bones/registry'

configureBoneyard({
  color: '#dedede',
  shimmerColor: '#f6f6f6',
  animate: 'shimmer',
  speed: '1.25s',
})

export default function BoneyardClient() {
  return null
}
