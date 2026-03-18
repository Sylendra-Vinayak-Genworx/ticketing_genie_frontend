import React from 'react'
import { CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { useSubscription } from '../hooks/useSubscription'

// Colour palette per position — index 0,1,2,3 maps to tiers in DB order
const PALETTE = [
  { ring: 'ring-gray-400',   activeBg: 'bg-gray-50',   border: 'border-gray-200',   checkColor: 'text-gray-500',   btn: 'bg-gray-700 hover:bg-gray-800'   },
  { ring: 'ring-blue-400',   activeBg: 'bg-blue-50',   border: 'border-blue-200',   checkColor: 'text-blue-600',   btn: 'bg-blue-600 hover:bg-blue-700'   },
  { ring: 'ring-violet-400', activeBg: 'bg-violet-50', border: 'border-violet-200', checkColor: 'text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700' },
  { ring: 'ring-amber-400',  activeBg: 'bg-amber-50',  border: 'border-amber-200',  checkColor: 'text-amber-600',  btn: 'bg-amber-500 hover:bg-amber-600'  },
]

function getPalette(index: number) {
  return PALETTE[index % PALETTE.length]
}

export default function SubscriptionPage() {
  const {
    tiers, isLoading, saving, confirm, setConfirm,
    currentTierId, currentTier,
    loadTiers, applyTier,
  } = useSubscription()

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Subscription"
        subtitle="Choose the support plan that fits your needs. Changes apply to new tickets immediately."
        actions={
          <button onClick={loadTiers} className="btn-ghost p-2" title="Refresh plans">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Active plan banner */}
      {!isLoading && currentTier && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your current plan</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{currentTier.name}</p>
            {currentTier.description && (
              <p className="text-sm text-gray-500 mt-0.5">{currentTier.description}</p>
            )}
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
            Active
          </span>
        </div>
      )}

      {!isLoading && !currentTier && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-500">You are on the free tier. Choose a plan below to get started.</p>
        </div>
      )}

      {/* Tier cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      ) : tiers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No plans available yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier, idx) => {
            const p         = getPalette(idx)
            const isCurrent = tier.tier_id === currentTierId
            const isSaving  = saving === tier.tier_id

            return (
              <div
                key={tier.tier_id}
                className={`
                  relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-200
                  ${isCurrent
                    ? `${p.border} ${p.activeBg} ring-2 ${p.ring} ring-offset-2 shadow-md`
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg'
                  }
                `}
              >
                {isCurrent && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold bg-white border border-gray-200 shadow-sm text-gray-700 whitespace-nowrap">
                    ✓ Current Plan
                  </span>
                )}

                <div className="mt-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
                  {tier.description ? (
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{tier.description}</p>
                  ) : (
                    <p className="text-sm text-gray-300 mt-1 italic">No description</p>
                  )}
                </div>

                <div className="border-t border-gray-100 my-2" />
                <div className="flex-1" />

                <button
                  onClick={() => isCurrent ? null : setConfirm(tier)}
                  disabled={isCurrent || isSaving}
                  className={`
                    mt-4 w-full py-2.5 rounded-xl text-sm font-semibold
                    flex items-center justify-center gap-2 transition-all
                    ${isCurrent
                      ? 'bg-gray-100 text-gray-400 cursor-default'
                      : `${p.btn} text-white active:scale-95`
                    }
                  `}
                >
                  {isSaving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Applying…</>
                  ) : isCurrent ? (
                    <><CheckCircle className="w-4 h-4" /> Active</>
                  ) : (
                    'Choose this plan'
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-2">
        Plan changes apply immediately to all new tickets. Existing tickets keep their original SLA.
      </p>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Switch to {confirm.name}?</h3>
            <p className="text-sm text-gray-600">
              {currentTier
                ? <>You are switching from <strong>{currentTier.name}</strong> to <strong>{confirm.name}</strong>.</>
                : <>You are subscribing to <strong>{confirm.name}</strong>.</>
              }
              {' '}This takes effect immediately for new tickets.
            </p>
            {confirm.description && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
                {confirm.description}
              </div>
            )}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setConfirm(null)} className="flex-1 btn-secondary">
                Cancel
              </button>
              <button onClick={() => applyTier(confirm)} className="flex-1 btn-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}