# TotalAssist Financial Model

## Executive Summary

TotalAssist is a B2C SaaS providing AI-powered technical support for homeowners. This model outlines revenue streams, unit economics, and growth projections.

---

## 1. Revenue Streams

### 1.1 Subscription Revenue (Recurring)

| Plan | Monthly | Annual | Annual Savings |
|------|---------|--------|----------------|
| **Free** | $0 | $0 | - |
| **Home** | $25/mo | $228/yr ($19/mo) | 24% |
| **Pro** | $59/mo | $588/yr ($49/mo) | 17% |

### 1.2 Credit Pack Revenue (One-Time)

| Product | Price | Credits | Per-Credit Cost |
|---------|-------|---------|-----------------|
| Video Diagnostic (Single) | $5 | 1 | $5.00 |
| Video Diagnostic (3-Pack) | $12 | 3 | $4.00 |

### 1.3 Revenue Mix Assumptions

| Revenue Type | Year 1 | Year 2 | Year 3 |
|--------------|--------|--------|--------|
| Subscription | 85% | 80% | 75% |
| Credit Packs | 15% | 20% | 25% |

---

## 2. Plan Features & Limits

| Feature | Free | Home ($25) | Pro ($59) |
|---------|------|------------|-----------|
| AI Chat Sessions | 5/mo | Unlimited | Unlimited |
| Photo Analysis | 2/mo | Unlimited | Unlimited |
| Video Sessions (Included) | 0 | 2/mo | 5/mo |
| Multi-Home Support | No | No | Yes (5 homes) |
| Session History | 7 days | Unlimited | Unlimited |
| Priority Support | No | No | Yes |

---

## 3. Unit Economics

### 3.1 Customer Acquisition Cost (CAC)

| Channel | CAC Estimate | % of Spend |
|---------|--------------|------------|
| Google Ads | $35-50 | 40% |
| Facebook/Instagram | $25-40 | 25% |
| Content/SEO | $15-25 | 20% |
| Referral Program | $10-15 | 15% |
| **Blended CAC** | **$28-38** | 100% |

**Target Blended CAC: $32**

### 3.2 Average Revenue Per User (ARPU)

| Metric | Monthly | Annual |
|--------|---------|--------|
| Home Plan ARPU | $25 | $300 |
| Pro Plan ARPU | $59 | $708 |
| + Avg Credit Purchases | $8 | $96 |
| **Blended ARPU** | **$35** | **$420** |

### 3.3 Customer Lifetime Value (LTV)

| Plan | Avg Lifespan | Monthly ARPU | LTV |
|------|--------------|--------------|-----|
| Home | 14 months | $27 | $378 |
| Pro | 22 months | $65 | $1,430 |
| **Blended** | **16 months** | **$38** | **$608** |

### 3.4 LTV:CAC Ratio

| Metric | Value | Benchmark |
|--------|-------|-----------|
| LTV | $608 | - |
| CAC | $32 | - |
| **LTV:CAC** | **19:1** | >3:1 is healthy |
| **CAC Payback** | **0.9 months** | <12 months is good |

---

## 4. Cost Structure

### 4.1 Variable Costs (per user/month)

| Cost Item | Home Plan | Pro Plan | Notes |
|-----------|-----------|----------|-------|
| Google Gemini API | $0.80 | $2.50 | Based on usage patterns |
| Email (Resend) | $0.02 | $0.05 | Transactional emails |
| Storage/CDN | $0.10 | $0.25 | Session history, images |
| Stripe Fees | $0.73 | $1.72 | 2.9% + $0.30 |
| **Total Variable** | **$1.65** | **$4.52** | - |
| **Gross Margin** | **93.4%** | **92.3%** | - |

### 4.2 Fixed Costs (Monthly)

| Category | Month 1-6 | Month 7-12 | Year 2 |
|----------|-----------|------------|--------|
| Hosting (Replit/AWS) | $50 | $200 | $500 |
| Domain/SSL | $5 | $5 | $5 |
| Email Service | $20 | $50 | $100 |
| Analytics/Monitoring | $0 | $50 | $100 |
| **Total Fixed** | **$75** | **$305** | **$705** |

### 4.3 Marketing Spend

| Phase | Monthly Budget | CAC Target | New Users/Mo |
|-------|----------------|------------|--------------|
| Launch (Mo 1-3) | $500 | $50 | 10 |
| Growth (Mo 4-6) | $1,500 | $38 | 40 |
| Scale (Mo 7-12) | $3,000 | $32 | 95 |
| Year 2 | $8,000 | $28 | 285 |

---

## 5. Conversion Funnel

### 5.1 Funnel Metrics (Target)

| Stage | Rate | Notes |
|-------|------|-------|
| Visitor → Free Signup | 5% | Landing page conversion |
| Free → Trial Start | 30% | Engage with product |
| Trial → Paid | 15% | 7-day trial conversion |
| **Visitor → Paid** | **2.25%** | Blended conversion |

### 5.2 Plan Distribution

| Plan | % of Paid Users | Rationale |
|------|-----------------|-----------|
| Home | 70% | Primary target market |
| Pro | 30% | Power users, landlords |

### 5.3 Billing Preference

| Billing | % of Users | Discount |
|---------|------------|----------|
| Monthly | 60% | None |
| Annual | 40% | 17-24% |

---

## 6. Churn Analysis

### 6.1 Churn Rates

| Metric | Home | Pro | Notes |
|--------|------|-----|-------|
| Monthly Churn | 7% | 4.5% | % of subscribers leaving |
| Annual Churn | 58% | 42% | Compounded |
| Avg Lifespan | 14 mo | 22 mo | 1/churn rate |

### 6.2 Churn Reasons (Industry Data)

| Reason | % | Mitigation |
|--------|---|------------|
| No longer needed | 35% | Engagement emails, new features |
| Too expensive | 25% | Annual discounts, promo codes |
| Switched competitor | 15% | Feature parity, UX improvement |
| Poor experience | 15% | Customer success, better onboarding |
| Other | 10% | Exit surveys |

### 6.3 Retention Strategies

1. **Trial Ending Emails** - 3-day and 1-day warnings (implemented)
2. **Win-Back Campaigns** - Special offers for churned users
3. **Annual Incentives** - 17-24% discount for annual billing
4. **Promo Codes** - SAVE20, ANNUAL25 (implemented)
5. **Feature Updates** - Regular product improvements

---

## 7. Growth Projections

### 7.1 User Growth

| Metric | Mo 3 | Mo 6 | Mo 12 | Year 2 |
|--------|------|------|-------|--------|
| Free Users | 150 | 400 | 1,200 | 4,500 |
| Paid Users | 25 | 85 | 320 | 1,400 |
| Conversion Rate | 17% | 21% | 27% | 31% |

### 7.2 Monthly Recurring Revenue (MRR)

| Metric | Mo 3 | Mo 6 | Mo 12 | Year 2 |
|--------|------|------|-------|--------|
| Home MRR | $438 | $1,488 | $5,600 | $24,500 |
| Pro MRR | $295 | $1,003 | $3,776 | $16,520 |
| **Total MRR** | **$733** | **$2,491** | **$9,376** | **$41,020** |

### 7.3 Annual Recurring Revenue (ARR)

| Metric | Year 1 End | Year 2 End |
|--------|------------|------------|
| MRR | $9,376 | $41,020 |
| **ARR** | **$112,512** | **$492,240** |

### 7.4 Total Revenue (Including Credits)

| Metric | Year 1 | Year 2 |
|--------|--------|--------|
| Subscription Revenue | $52,000 | $295,000 |
| Credit Pack Revenue | $9,200 | $73,800 |
| **Total Revenue** | **$61,200** | **$368,800** |

---

## 8. Profitability Analysis

### 8.1 Year 1 P&L

| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **Revenue** | $61,200 | 100% |
| Variable Costs | $(4,100) | 6.7% |
| **Gross Profit** | $57,100 | 93.3% |
| Marketing | $(18,000) | 29.4% |
| Fixed Costs | $(2,280) | 3.7% |
| **Operating Profit** | **$36,820** | **60.2%** |

### 8.2 Year 2 P&L

| Line Item | Amount | % Revenue |
|-----------|--------|-----------|
| **Revenue** | $368,800 | 100% |
| Variable Costs | $(27,500) | 7.5% |
| **Gross Profit** | $341,300 | 92.5% |
| Marketing | $(96,000) | 26.0% |
| Fixed Costs | $(8,460) | 2.3% |
| **Operating Profit** | **$236,840** | **64.2%** |

### 8.3 Break-Even Analysis

| Metric | Value |
|--------|-------|
| Fixed Costs (Monthly) | $305 |
| Avg Contribution Margin | $33.35 |
| **Break-Even Users** | **10 paid users** |
| **Target Break-Even** | **Month 2** |

---

## 9. Key Performance Indicators (KPIs)

### 9.1 North Star Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| **MRR Growth** | 15%/mo | Month-over-month |
| **Net Revenue Retention** | >100% | Expansion - Churn |
| **LTV:CAC** | >15:1 | Lifetime value / acquisition cost |

### 9.2 Weekly Dashboard

| Metric | Track |
|--------|-------|
| New signups | Daily |
| Trial starts | Daily |
| Conversions | Daily |
| Churn | Weekly |
| MRR | Weekly |
| Support tickets | Daily |

### 9.3 Monthly Review

| Metric | Target |
|--------|--------|
| Visitor → Signup | >5% |
| Trial → Paid | >15% |
| Monthly Churn | <6% |
| NPS Score | >50 |
| Avg Session Rating | >4.5/5 |

---

## 10. Sensitivity Analysis

### 10.1 Churn Impact on LTV

| Monthly Churn | Lifespan | LTV | LTV:CAC |
|---------------|----------|-----|---------|
| 4% | 25 mo | $950 | 30:1 |
| 6% | 17 mo | $646 | 20:1 |
| **7% (Base)** | **14 mo** | **$608** | **19:1** |
| 10% | 10 mo | $380 | 12:1 |
| 15% | 7 mo | $266 | 8:1 |

### 10.2 Pricing Impact

| Home Price | Pro Price | Blended ARPU | Year 1 Revenue |
|------------|-----------|--------------|----------------|
| $19 | $49 | $28 | $48,800 |
| **$25** | **$59** | **$35** | **$61,200** |
| $29 | $69 | $41 | $71,500 |
| $35 | $79 | $48 | $83,700 |

### 10.3 Conversion Rate Impact

| Trial → Paid | Paid Users (Y1) | MRR (Y1 End) |
|--------------|-----------------|--------------|
| 10% | 213 | $6,250 |
| **15% (Base)** | **320** | **$9,376** |
| 20% | 427 | $12,500 |
| 25% | 533 | $15,625 |

---

## 11. Funding & Runway

### 11.1 Bootstrap Scenario (Current)

| Metric | Value |
|--------|-------|
| Initial Investment | $0 |
| Monthly Burn (Mo 1-3) | $575 |
| Monthly Burn (Mo 4-6) | $1,805 |
| Break-Even | Month 2 |
| Profitable | Month 3+ |

### 11.2 Growth Investment Scenario

| Metric | Seed Round |
|--------|------------|
| Raise Amount | $150,000 |
| Monthly Marketing | $10,000 |
| Monthly Operations | $2,000 |
| Runway | 12.5 months |
| Target MRR at Exit | $50,000 |
| Target ARR | $600,000 |

---

## 12. Competitive Positioning

### 12.1 Market Comparison

| Service | Price | Response Time | AI-Powered |
|---------|-------|---------------|------------|
| Geek Squad | $150+/visit | Days | No |
| HelloTech | $79+/visit | Hours | No |
| Traditional IT Support | $100+/hour | Days | No |
| **TotalAssist** | **$25/mo** | **Instant** | **Yes** |

### 12.2 Value Proposition

- **Cost**: 1 Geek Squad visit = 6 months of TotalAssist Home
- **Speed**: Instant AI response vs. days of waiting
- **Convenience**: Help from your couch, 24/7
- **Coverage**: Unlimited issues vs. per-incident pricing

---

## 13. Risk Factors

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI API cost increase | Medium | High | Multi-provider strategy, caching |
| Competitor entry | High | Medium | First-mover advantage, brand loyalty |
| Low conversion | Medium | High | Onboarding optimization, A/B testing |
| High churn | Medium | High | Engagement features, win-back campaigns |
| Tech support quality | Low | High | Continuous model improvement |

---

## 14. Milestones & Goals

### Year 1

| Quarter | Goal | Metric |
|---------|------|--------|
| Q1 | Launch & Validate | 50 paid users, $1,500 MRR |
| Q2 | Optimize Funnel | 150 paid users, $4,500 MRR |
| Q3 | Scale Marketing | 250 paid users, $7,500 MRR |
| Q4 | Expand Features | 320 paid users, $9,400 MRR |

### Year 2

| Quarter | Goal | Metric |
|---------|------|--------|
| Q1 | Geographic Expansion | 500 paid users |
| Q2 | Enterprise/B2B Pilot | First B2B contracts |
| Q3 | Mobile App Launch | 1,000 paid users |
| Q4 | Series A Prep | $40,000 MRR, $480K ARR |

---

## Appendix: Formula Reference

```
LTV = ARPU × Average Lifespan
Average Lifespan = 1 / Monthly Churn Rate
CAC Payback = CAC / Monthly ARPU
LTV:CAC Ratio = LTV / CAC
MRR = Σ(Active Subscribers × Monthly Price)
ARR = MRR × 12
Net Revenue Retention = (Starting MRR + Expansion - Churn) / Starting MRR
Gross Margin = (Revenue - Variable Costs) / Revenue
```

---

*Last Updated: February 2026*
*TotalAssist - Smart Tek Labs*
