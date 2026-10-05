'use client';

import { useState, useEffect } from 'react';
import { createKnowledgeBase, getKnowledgeBases, deleteKnowledgeBase } from '@/lib/actions/knowledge.actions';
import { toast } from 'sonner';
import { Loader2, Trash, Upload, FileText } from 'lucide-react';

export default function KnowledgeBaseManager() {
  const [kbs, setKbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);

  const fetchKbs = async () => {
    try {
      const data = await getKnowledgeBases();
      setKbs(data);
    } catch (e: any) {
      toast.error('Failed to load knowledge bases: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKbs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createKnowledgeBase(newTitle);
      setNewTitle('');
      fetchKbs();
      toast.success('Knowledge Base created');
    } catch (e: any) {
      toast.error('Error creating: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await deleteKnowledgeBase(id);
      fetchKbs();
      toast.success('Deleted');
    } catch (e: any) {
      toast.error('Error deleting: ' + e.message);
    }
  };

  const handleUpload = async (kbId: string, file: File) => {
    setUploadingTo(kbId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kbId', kbId);
      
      const res = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      toast.success(`Successfully uploaded and processed ${data.chunks} chunks`);
      fetchKbs();
    } catch (e: any) {
      toast.error('Upload failed: ' + e.message);
    } finally {
      setUploadingTo(null);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="flex gap-4 p-6 border rounded-xl bg-card">
        <input 
          type="text" 
          placeholder="New Knowledge Base Title (e.g., Biology 101 Notes)" 
          className="flex-grow p-3 rounded-lg border bg-background"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit" className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90">
          Create
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kbs.map(kb => (
          <div key={kb.id} className="border rounded-xl p-6 bg-card flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{kb.title}</h3>
              <button onClick={() => handleDelete(kb.id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-lg">
                <Trash className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground font-semibold mb-2">Documents:</p>
              {kb.documents && kb.documents.length > 0 ? (
                <ul className="space-y-2">
                  {kb.documents.map((doc: any) => (
                    <li key={doc.id} className="flex items-center gap-2 text-sm bg-background p-2 rounded-md">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="truncate">{doc.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">No documents yet.</p>
              )}
            </div>

            <div className="mt-4">
              <label className="relative flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-background/50 transition-colors">
                {uploadingTo === kb.id ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Upload PDF</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="application/pdf"
                  className="hidden" 
                  disabled={uploadingTo === kb.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(kb.id, file);
                  }}
                />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
