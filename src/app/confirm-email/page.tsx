import { Suspense } from 'react'
import ConfirmEmailPage from '@/views/ConfirmEmailPage'

export default function Page() {
	return (
		<Suspense fallback={null}>
			<ConfirmEmailPage />
		</Suspense>
	)
}
