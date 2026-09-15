<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'
import Dashboard from '@uppy/vue/dashboard'
import '@uppy/core/css/style.min.css'
import '@uppy/dashboard/css/style.min.css'
import '@uppy/webcam/css/style.min.css'
import api from '../services/api'

const props = defineProps({ modelValue: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue'])
const category = ref('national_id_front')
const uploading = ref(false)
const error = ref('')
const pendingCount = ref(0)
const uploaded = computed(() => props.modelValue)
const categories = [
  ['national_id_front', 'National ID — front'], ['national_id_back', 'National ID — back'],
  ['borrower_photo', 'Borrower photograph'], ['proof_of_residence', 'Proof of residence'],
  ['lc1_letter', 'LC1 letter'], ['income_evidence', 'Income evidence'],
  ['business_evidence', 'Business evidence'], ['bank_statement', 'Bank statement'],
  ['mobile_money_statement', 'Mobile money statement'], ['security_evidence', 'Security evidence'],
]
const labelFor = (value) => categories.find(([key]) => key === value)?.[1] || value.replaceAll('_', ' ')
const uppy = new Uppy({
  id: `kopa-documents-${Math.random().toString(36).slice(2)}`,
  autoProceed: false,
  restrictions: { maxFileSize: 10 * 1024 * 1024, maxNumberOfFiles: 12, allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] },
}).use(Webcam, { modes: ['picture'], mirror: false })
uppy.on('file-added', (file) => { uppy.setFileMeta(file.id, { category: category.value }); pendingCount.value = uppy.getFiles().length })
uppy.on('file-removed', () => { pendingCount.value = uppy.getFiles().length })

async function upload() {
  const pending = uppy.getFiles()
  if (!pending.length) return
  uploading.value = true; error.value = ''
  const additions = []
  try {
    for (const file of pending) {
      const documentCategory = file.meta.category || category.value
      const { data: presignResponse } = await api.post('/documents/presign', { category: documentCategory, content_type: file.type, original_name: file.name })
      const upload = presignResponse.data
      if (upload.direct_upload) {
        const response = await fetch(upload.url, { method: 'PUT', headers: upload.headers || { 'Content-Type': file.type }, body: file.data })
        if (!response.ok) throw new Error('The secure file transfer failed.')
        const { data } = await api.post('/documents/complete', { category: documentCategory, path: upload.path, original_name: file.name, mime_type: file.type, size_bytes: file.size })
        additions.push(data.data)
      } else {
        const payload = new FormData()
        payload.append('category', documentCategory)
        payload.append('file', file.data, file.name)
        const { data } = await api.post('/documents', payload)
        additions.push(data.data)
      }
      uppy.removeFile(file.id)
    }
    emit('update:modelValue', [...props.modelValue, ...additions])
  } catch (e) {
    error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Documents could not be uploaded.'
  } finally { uploading.value = false }
}

async function remove(document) {
  try {
    await api.delete(`/documents/${document.id}`)
    emit('update:modelValue', props.modelValue.filter((item) => item.id !== document.id))
  } catch (e) { error.value = e.response?.data?.message || 'Document could not be removed.' }
}

onBeforeUnmount(() => uppy.destroy())
</script>

<template>
  <section class="upload-studio">
    <div class="upload-toolbar">
      <label><span class="label">Document category</span><select v-model="category" class="field"><option v-for="item in categories" :key="item[0]" :value="item[0]">{{ item[1] }}</option></select></label>
      <p>Choose the category before selecting files. Photos can be taken from the device camera.</p>
    </div>
    <Dashboard :uppy="uppy" :props="{ height: 300, proudlyDisplayPoweredByUppy: false, hideUploadButton: true, plugins: ['Webcam'], note: 'JPG, PNG, WebP or PDF · 10 MB maximum' }" />
    <p v-if="error" class="form-error">{{ error }}</p>
    <div class="mt-4 flex justify-end"><button type="button" class="btn-primary" :disabled="uploading || !pendingCount" @click="upload">{{ uploading ? 'Uploading securely' : 'Upload selected files' }}</button></div>
    <div v-if="uploaded.length" class="document-list">
      <article v-for="document in uploaded" :key="document.id"><div><strong>{{ labelFor(document.category) }}</strong><span>{{ document.original_name }}</span></div><button type="button" @click="remove(document)">Remove</button></article>
    </div>
  </section>
</template>
