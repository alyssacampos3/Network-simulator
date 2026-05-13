import { create } from 'zustand'

export interface PacketAnimation {
  id: string
  edgeIds: string[]       // ordered list of edges to animate along
  currentEdge: number     // index into edgeIds
  success: boolean
  active: boolean
}

interface AnimationState {
  animations: PacketAnimation[]
  activeEdges: Set<string>  // edges currently carrying traffic (for pulse effect)
}

interface AnimationActions {
  startAnimation(edgeIds: string[], success: boolean): void
  tickAnimation(id: string): void
  stopAnimation(id: string): void
  pulseEdge(edgeId: string): void
  clearAll(): void
}

export const useAnimationStore = create<AnimationState & AnimationActions>((set, get) => ({
  animations: [],
  activeEdges: new Set(),

  startAnimation(edgeIds, success) {
    if (edgeIds.length === 0) return
    const anim: PacketAnimation = {
      id: crypto.randomUUID(),
      edgeIds,
      currentEdge: 0,
      success,
      active: true,
    }
    set(state => ({ animations: [...state.animations, anim] }))

    // Auto-advance through edges
    const advance = (animId: string, edgeIndex: number) => {
      setTimeout(() => {
        const current = get().animations.find(a => a.id === animId)
        if (!current || !current.active) return
        if (edgeIndex >= current.edgeIds.length) {
          get().stopAnimation(animId)
          return
        }
        set(state => ({
          animations: state.animations.map(a =>
            a.id === animId ? { ...a, currentEdge: edgeIndex } : a
          ),
        }))
        advance(animId, edgeIndex + 1)
      }, 400)
    }
    advance(anim.id, 0)
  },

  tickAnimation(id) {
    set(state => ({
      animations: state.animations.map(a =>
        a.id === id ? { ...a, currentEdge: a.currentEdge + 1 } : a
      ),
    }))
  },

  stopAnimation(id) {
    set(state => ({
      animations: state.animations.filter(a => a.id !== id),
    }))
  },

  pulseEdge(edgeId) {
    set(state => {
      const next = new Set(state.activeEdges)
      next.add(edgeId)
      return { activeEdges: next }
    })
    setTimeout(() => {
      set(state => {
        const next = new Set(state.activeEdges)
        next.delete(edgeId)
        return { activeEdges: next }
      })
    }, 1200)
  },

  clearAll() {
    set({ animations: [], activeEdges: new Set() })
  },
}))
