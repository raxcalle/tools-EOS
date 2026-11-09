export default function ContentCard({
  title, children, action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-head-left">
          <span className="card-title">{title}</span>
        </div>
        {action}
      </div>
      <div className="card-body">{children}</div>
    </div>
  )
}
