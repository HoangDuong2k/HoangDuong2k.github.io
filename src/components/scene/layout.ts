import type { DocId, Focus } from '@/lib/store'

type Vec3 = [number, number, number]

/** Where each document lies on the desk (desk surface is y = 0). */
export const DOCS: Record<DocId, { pos: Vec3; rotY: number; label: string }> = {
  resume: { pos: [-0.97, 0, 0.4], rotY: 0.16, label: 'Resume' },
  projects: { pos: [-1.42, 0, 0.02], rotY: -0.22, label: 'Projects folder' },
  contact: { pos: [0.78, 0, -0.28], rotY: -0.22, label: 'Business card' },
  note: { pos: [0.6, 0.47, -0.41], rotY: 0, label: 'Sticky note' },
}

export const SCREEN = { center: [0, 0.78, -0.414] as Vec3, width: 1.48, height: 0.86 }

/** Room shell: back wall plane z, left wall plane x, floor y. */
export const ROOM = { backZ: -1.0, leftX: -2.4, floorY: -1.6 }

export const HOME = { pos: [3.4, 2.2, 4.6] as Vec3, target: [0, 0.25, 0] as Vec3 }

export function poseFor(focus: Exclude<Focus, null>): { pos: Vec3; target: Vec3 } {
  if (focus === 'computer') {
    const [x, y, z] = SCREEN.center
    return { pos: [x, y, z + 1.4], target: [x, y, z] }
  }
  const [x, y, z] = DOCS[focus].pos
  if (focus === 'note') return { pos: [x, y, z + 0.7], target: [x, y, z] }
  return { pos: [x, y + 1.3, z + 0.55], target: [x, y, z] }
}
