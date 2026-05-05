export interface GuideStep {
  title: string
  description: string
}

export interface GuideTip {
  title: string
  text: string
}

export interface Guide {
  slug: string
  title: string
  category: string
  excerpt: string
  readTime: string
  date: string
  content: string[]
  steps: GuideStep[]
  tips: GuideTip[]
  relatedGuides: string[]
}

export interface GuideCategory {
  id: string
  label: string
  icon: string
}
