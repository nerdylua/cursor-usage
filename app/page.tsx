import { CursorUsageDashboard } from "@/app/usage-dashboard"
import { getCursorUsageDashboard } from "@/lib/cursor-usage"

export default function Home() {
  const data = getCursorUsageDashboard()

  return <CursorUsageDashboard data={data} />
}
