import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import RefrigeratorForm from '../components/refrigerators/RefrigeratorForm'
import { useCustomers } from '../hooks/useCustomers'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function AddRefrigerator() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)
  const presetCustomerId = searchParams.get('customer')

  const { customers, loading: customersLoading } = useCustomers()
  const [initialValues, setInitialValues] = useState(null)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    if (!isEditing) {
      setInitialValues({ customer_id: presetCustomerId || '' })
      return
    }
    supabase
      .from('refrigerators')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message)
          navigate('/refrigerators')
          return
        }
        setInitialValues({
          customer_id: data.customer_id,
          serial_number: data.serial_number || '',
          model: data.model || '',
          installation_date: data.installation_date || '',
          status: data.status,
          notes: data.notes || '',
        })
        setLoading(false)
      })
  }, [isEditing, id, presetCustomerId, navigate, toast])

  const handleSubmit = async (payload) => {
    try {
      if (isEditing) {
        const { customer_id, ...updates } = payload
        void customer_id
        const { error } = await supabase.from('refrigerators').update(updates).eq('id', id)
        if (error) throw new Error(error.message)
        toast.success(t('refrigerators.saved'))
        navigate(`/refrigerators/${id}`)
      } else {
        const { data, error } = await supabase.from('refrigerators').insert(payload).select().single()
        if (error) throw new Error(error.message)
        toast.success(t('refrigerators.saved'))
        navigate(`/refrigerators/${data.id}`)
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      <h1 className="text-xl font-bold text-slate-900">
        {isEditing ? t('refrigerators.edit') : t('refrigerators.add')}
      </h1>

      <Card className="mt-4 p-5">
        {loading || customersLoading || !initialValues ? (
          <Spinner label={t('common.loadingData')} />
        ) : (
          <RefrigeratorForm
            initialValues={initialValues}
            customers={customers}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
            submitLabel={isEditing ? t('common.save') : t('refrigerators.add')}
            disableCustomerSelect={isEditing}
          />
        )}
      </Card>
    </div>
  )
}
