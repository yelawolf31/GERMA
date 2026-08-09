import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'
import CustomerForm from '../components/customers/CustomerForm'
import { useTranslation } from '../i18n'
import { useToast } from '../hooks/useToast'
import { supabase } from '../lib/supabase'

export default function AddCustomer() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)

  const [initialValues, setInitialValues] = useState(null)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    if (!isEditing) return
    supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error(error.message)
          navigate('/customers')
          return
        }
        setInitialValues({
          name: data.name,
          business_type: data.business_type || '',
          phone: data.phone || '',
          address: data.address || '',
          wilaya: data.wilaya || '',
          commune: data.commune || '',
          latitude: data.latitude ?? '',
          longitude: data.longitude ?? '',
          status: data.status,
          notes: data.notes || '',
        })
        setLoading(false)
      })
  }, [isEditing, id, navigate, toast])

  const handleSubmit = async (payload) => {
    try {
      if (isEditing) {
        const updates = { ...payload }
        delete updates.created_by
        const { error } = await supabase.from('customers').update(updates).eq('id', id)
        if (error) throw new Error(error.message)
        toast.success(t('customers.saved'))
        navigate(`/customers/${id}`)
      } else {
        const { data, error } = await supabase.from('customers').insert(payload).select().single()
        if (error) throw new Error(error.message)
        toast.success(t('customers.saved'))
        navigate(`/customers/${data.id}`)
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
        {isEditing ? t('customers.edit') : t('customers.add')}
      </h1>

      <Card className="mt-4 p-5">
        {loading ? (
          <Spinner label={t('common.loadingData')} />
        ) : (
          <CustomerForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onCancel={() => navigate(-1)}
            submitLabel={isEditing ? t('common.save') : t('customers.add')}
          />
        )}
      </Card>
    </div>
  )
}
