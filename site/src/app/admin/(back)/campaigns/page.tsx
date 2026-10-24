import { initDb } from '@/lib/db/loader';
import { listCampaigns, allTags } from '@/lib/admin/dao';
import CampaignsManager from '@/components/admin/CampaignsManager';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  await initDb();
  const campaigns = listCampaigns();
  const tags = allTags();
  return (
    <>
      <div className="adm-page-head">
        <div>
          <h1>邮件推广</h1>
          <p>按分组标签群发推广邮件 · 收件人取自用户管理的客户标签</p>
        </div>
      </div>
      <CampaignsManager initial={campaigns as never} tags={tags} />
    </>
  );
}
