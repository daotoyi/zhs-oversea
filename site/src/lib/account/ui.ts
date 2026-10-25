/**
 * 账户相关界面文案（英文原文 / 简体中文，繁体经 OpenCC 派生）
 *
 * 与站点既有约定一致：英文站以英文为准，中文整体替换。
 */

import type { Locale } from '@/lib/i18n/config';
import { toTraditional } from '@/lib/i18n/convert';

export type AccountLabels = ReturnType<typeof buildLabels>;

function buildLabels(en: boolean, tr: (s: string) => string) {
  const L = (e: string, c: string) => (en ? e : tr(c));
  return {
    /* 通用 */
    account: L('Account', '我的账户'),
    signIn: L('Sign in', '登录'),
    signUp: L('Create account', '注册'),
    signOut: L('Sign out', '退出登录'),
    email: L('Email', '邮箱'),
    password: L('Password', '密码'),
    newPassword: L('New password', '新密码'),
    confirmPassword: L('Confirm password', '确认密码'),
    name: L('Name', '姓名'),
    birthday: L('Birthday', '生日'),
    optional: L('optional', '选填'),
    save: L('Save', '保存'),
    saving: L('Saving…', '保存中…'),
    saved: L('Saved', '已保存'),
    cancel: L('Cancel', '取消'),
    back: L('Back', '返回'),
    loading: L('Working…', '处理中…'),

    /* 登录 / 注册 */
    authTitle: L('Your account', '我的账户'),
    authLead: L(
      'Sign in to track orders, keep a list of objects you are considering, and collect member points on every purchase.',
      '登录后可查看订单、收藏在意的器物，并在每次购买时累积会员积分。'
    ),
    loginTab: L('Sign in', '登录'),
    registerTab: L('Create account', '注册'),
    emailPlaceholder: L('you@example.com', 'you@example.com'),
    passwordHint: L('At least 8 characters, letters and numbers.', '至少 8 位，需含字母与数字。'),
    submitLogin: L('Sign in', '登录'),
    submitRegister: L('Create account', '创建账户'),
    forgotLink: L('Forgot your password?', '忘记密码？'),
    noAccount: L('No account yet?', '还没有账户？'),
    haveAccount: L('Already registered?', '已经注册过？'),
    orContinue: L('or continue with', '或使用以下方式'),
    continueWith: L('Continue with', '用'),
    notEnabled: L('not enabled', '未开通'),
    oauthNote: L(
      'Google and Apple sign-in require the shop owner to finish OAuth setup. Email sign-in works right away.',
      'Google 与 Apple 登录需店主完成授权配置后启用；邮箱登录现在即可使用。'
    ),
    oauthNoteReady: L(
      'You will be redirected to the provider to authorize, then back here. We never see your password.',
      '点击后会跳转到对应平台授权，再返回本页。我们不会接触你的密码。'
    ),
    marketingOptIn: L('Email me new objects and seasonal notes.', '愿意接收新品与节令通信。'),

    /* 忘记 / 重设密码 */
    forgotTitle: L('Reset your password', '重设密码'),
    forgotLead: L(
      'Enter the email on your account. We will send a link that expires in one hour.',
      '请输入账户邮箱，我们会发送一条一小时内有效的重设链接。'
    ),
    submitForgot: L('Send reset link', '发送重设链接'),
    forgotSent: L(
      'If that email has an account, the link is on its way. Check your inbox.',
      '若该邮箱有对应账户，重设链接已发出，请注意查收。'
    ),
    resetTitle: L('Set a new password', '设置新密码'),
    resetLead: L('Choose a password you have not used here before.', '请设置一个此前未使用过的密码。'),
    submitReset: L('Update password', '更新密码'),
    resetDone: L('Password updated. You can sign in now.', '密码已更新，请重新登录。'),

    /* 账户页 */
    hello: L('Signed in as', '当前账户'),
    memberSince: L('Member since', '注册于'),
    points: L('Points', '积分'),
    pointsUnit: L('pts', '分'),
    tier: L('Tier', '等级'),
    nextTierAt: L('next tier at', '升级所需'),
    ordersTitle: L('Your orders', '我的订单'),
    ordersEmpty: L('No orders yet.', '暂无订单。'),
    favoritesTitle: L('Saved objects', '我的收藏'),
    favoritesEmpty: L('Nothing saved yet. Tap the heart on any object.', '还没有收藏，可在商品页点击心形图标。'),
    profileTitle: L('Profile', '个人资料'),
    securityTitle: L('Password & security', '密码与安全'),
    birthdayTitle: L('Birthday gift', '生日礼'),
    birthdayLead: L(
      'Tell us the day (no year) and we will send a 15% gift coupon plus 200 points in your birthday month.',
      '填写生日（无需年份），生日当月我们会送上 15% 生日券与 200 积分。'
    ),
    birthdayUnset: L('Not set yet.', '尚未填写。'),
    birthdayMonthHint: L('Valid this month — applied automatically.', '本月有效，已自动发放。'),
    birthdayNotYet: L('Your gift arrives in your birthday month.', '生日当月自动发放。'),
    redeemTitle: L('Redeem points', '积分兑换'),
    redeemLead: L('Points become a one-time coupon you can use at checkout.', '积分可兑换成一次性优惠券，结账时使用。'),
    redeemBtn: L('Redeem', '兑换'),
    redeemNeed: L('need', '需'),
    redeeemGot: L('Your coupon', '优惠券'),
    ledgerTitle: L('Points activity', '积分明细'),
    ledgerEmpty: L('No activity yet.', '暂无记录。'),
    trackNo: L('Tracking', '运单号'),
    orderStatusPaid: L('Paid', '已支付'),
    orderStatusRefunded: L('Refunded', '已退款'),
    orderStatusDisputed: L('In review', '处理中'),
    orderStatusShipped: L('Shipped', '已发货'),
    orderStatusDelivered: L('Delivered', '已送达'),
    orderStatusCancelled: L('Cancelled', '已取消'),
    orderStatusPending: L('Pending', '待处理'),
    viewOrder: L('Details', '查看详情'),

    /* ── 订单详情 ── */
    orderDetailTitle: L('Order detail', '订单详情'),
    orderPlacedAt: L('Placed on', '下单时间'),
    logisticsTitle: L('Logistics', '物流'),
    carrier: L('Carrier', '承运商'),
    trackingNumber: L('Tracking number', '运单号'),
    noTrackingYet: L('The tracking number appears here once the parcel is scanned.', '包裹扫描后，运单号会显示在这里。'),
    etaTitle: L('Estimated arrival', '预计送达'),
    etaRange: L('7–15 business days after dispatch', '发货后 7–15 个工作日'),
    stepPlaced: L('Order placed', '已下单'),
    stepPaid: L('Paid', '已付款'),
    stepShipped: L('Shipped', '已发货'),
    stepDelivered: L('Delivered', '已送达'),
    itemsTitle: L('Items', '商品明细'),
    addressTitle: L('Shipping address', '收货地址'),
    noAddress: L('No address on file.', '暂无收货地址。'),
    couponUsed: L('Coupon', '优惠券'),
    paymentTitle: L('Payment', '支付方式'),
    refundTitle: L('Refund', '退款'),
    refundApply: L('Request a refund', '申请退款'),
    refundReason: L('Why are you requesting a refund?', '请说明退款原因'),
    refundReasonPh: L('Item arrived damaged, wrong item, changed my mind…', '商品破损、发错货、不想要了……'),
    refundSubmit: L('Submit refund request', '提交退款申请'),
    refundSubmitted: L('Refund request submitted', '退款申请已提交'),
    refundPending: L(
      'Your request is under review. We reply by email within two business days.',
      '退款申请正在审核中，我们会在两个工作日内邮件回复。'
    ),
    refundApproved: L('Refund approved', '退款已批准'),
    refundRejected: L('Refund declined', '退款未通过'),
    refundAdminNote: L('Our reply', '我们的回复'),
    refundNotEligible: L(
      'This order cannot be refunded online. If something is wrong with it, contact us and we will make it right.',
      '该订单无法在线退款。若商品有问题，请联系我们，我们负责解决。'
    ),
    removeFavorite: L('Remove', '移除'),
    favoriteAdd: L('Save', '收藏'),
    favoriteSaved: L('Saved', '已收藏'),
    loginToSave: L('Sign in to save', '登录后可收藏'),
    changePassword: L('Change password', '修改密码'),
    setPassword: L('Set a password', '设置密码'),
    currentPassword: L('Current password', '当前密码'),
    passwordSetForOauth: L(
      'You signed up with Google or Apple. Setting a password lets you sign in with email too.',
      '你此前通过 Google 或 Apple 登录。设置密码后也可用邮箱登录。'
    ),
    dangerZone: L('Sign out of all devices', '登出所有设备'),
    copyCode: L('Copy code', '复制优惠码'),
    copied: L('Copied', '已复制'),
    itemsCount: L('items', '件'),
    subtotal: L('Subtotal', '小计'),
    discount: L('Discount', '优惠'),
    shipping: L('Shipping', '运费'),
    tax: L('Tax', '税费'),
    freeShipping: L('Free', '免运费'),
    total: L('Total', '合计'),

    /* 错误 */
    errGeneric: L('Something went wrong. Please try again.', '出错了，请重试。'),
    errNetwork: L('Network error. Check your connection.', '网络异常，请检查连接。'),
    errProviderDisabled: L('That sign-in method is not enabled yet.', '该登录方式尚未启用。'),
    errOauthFailed: L('Sign-in with that provider failed. Please try again.', '第三方登录失败，请重试。'),
    errNoEmail: L('That account did not share an email address, so we could not create a profile.', '该账号未提供邮箱，无法创建账户。'),
    errAccountDisabled: L('This account is not active. Please contact us.', '账户不可用，请联系我们。'),
    errState: L('The sign-in link expired. Please start again.', '登录链接已失效，请重新发起。'),
  };
}

export function accountLabels(locale: Locale): AccountLabels {
  return buildLabels(locale === 'en', (s) => (locale === 'zh-Hant' ? toTraditional(s) : s));
}

export function orderStatusLabel(status: string, labels: AccountLabels): string {
  switch (status) {
    case 'paid':
      return labels.orderStatusPaid;
    case 'refunded':
      return labels.orderStatusRefunded;
    case 'disputed':
      return labels.orderStatusDisputed;
    case 'shipped':
      return labels.orderStatusShipped;
    case 'delivered':
      return labels.orderStatusDelivered;
    case 'cancelled':
      return labels.orderStatusCancelled;
    default:
      return labels.orderStatusPending;
  }
}
