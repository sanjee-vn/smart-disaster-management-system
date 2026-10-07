import { CircleAlert } from 'lucide-react'

export default function ValidationMessage({ message }) {
  if (!message) return null
  return <p className="validation-message"><CircleAlert size={13} />{message}</p>
}
