import PageHeader from '../components/PageHeader'
import { Card } from '@/components/ui/card'

export default function LinkItems() {
  const header = <PageHeader title="Link Items" />

  return (
    <>
      {header}
      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Create Relationship
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Link items form will appear here.
        </p>
        <ul className="mt-2 pl-6 list-disc text-zinc-500 dark:text-zinc-400">
          <li>Select source item</li>
          <li>Select target item</li>
          <li>Choose relationship type</li>
          <li>Add context</li>
        </ul>
      </Card>

      <Card className="p-5 md:p-6 mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Relationship Types
        </h2>
        <div className="text-zinc-500 dark:text-zinc-400">
          <p>• Related</p>
          <p>• Supports</p>
          <p>• Contradicts</p>
          <p>• Context</p>
        </div>
      </Card>

      <Card className="p-5 md:p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Existing Relationships
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          [Placeholder] Your current item relationships will appear here.
        </p>
      </Card>
    </>
  )
}
