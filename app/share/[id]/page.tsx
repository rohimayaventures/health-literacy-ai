import { Metadata } from 'next'
import ShareView from './ShareView'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await params
  return {
    title: 'Shared Translation — HealthLiteracy AI',
    description: 'A plain-language translation of a medical document.',
  }
}

export default async function SharePage({ params }: Props) {
  const { id } = await params
  return <ShareView id={id} />
}
