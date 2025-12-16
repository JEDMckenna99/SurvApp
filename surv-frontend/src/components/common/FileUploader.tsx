import { useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { apiClient } from '../../api/client'

interface FileUploaderProps {
  entityType: 'job' | 'customer' | 'invoice'
  entityId: string
  category?: 'before_photo' | 'after_photo' | 'document' | 'signature'
  onUploadComplete?: () => void
}

interface UploadedFile {
  id: string
  filename: string
  file_size: number
  category: string
  uploaded_at: string
}

export default function FileUploader({ 
  entityType, 
  entityId, 
  category,
  onUploadComplete 
}: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/v1/files/${entityType}/${entityId}`)
      setFiles(response.data)
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const formData = new FormData()
        formData.append('file', selectedFiles[i])
        formData.append('entity_type', entityType)
        formData.append('entity_id', entityId)
        if (category) formData.append('category', category)

        await apiClient.post('/api/v1/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully`)
      loadFiles()
      if (onUploadComplete) onUploadComplete()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'File upload failed')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await apiClient.delete(`/api/v1/files/${fileId}`)
      toast.success('File deleted')
      loadFiles()
    } catch (error) {
      toast.error('Failed to delete file')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  useState(() => {
    loadFiles()
  }, [entityId])

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Files & Photos
        </Typography>
        <Button
          variant="contained"
          component="label"
          startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input
            type="file"
            hidden
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileUpload}
          />
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'grey.50', borderRadius: 1 }}>
          <FileIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
          <Typography color="text.secondary">
            No files uploaded yet
          </Typography>
        </Box>
      ) : (
        <List>
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}
            >
              <FileIcon sx={{ mr: 2, color: 'primary.main' }} />
              <ListItemText
                primary={file.filename}
                secondary={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                    <Typography variant="caption">{formatFileSize(file.file_size)}</Typography>
                    {file.category && (
                      <Chip label={file.category.replace('_', ' ')} size="small" />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {new Date(file.uploaded_at).toLocaleString()}
                    </Typography>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete(file.id)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
}











