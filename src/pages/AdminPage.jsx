import { useEffect, useMemo, useState } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Layers,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Package,
  PackagePlus,
  Pencil,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { auth } from '../firebase';
import {
  ADMIN_UID,
  deleteEnquiry,
  ENQUIRY_STATUSES,
  subscribeEnquiries,
  updateEnquiryStatus,
} from '../services/enquiriesService';
import {
  addProduct,
  deleteProduct,
  getAllProducts,
  seedProductsIfEmpty,
  updateProduct,
} from '../services/productsService';
import {
  syncAdminEnquiryNotification,
  sendCustomerEnquiryResponse,
  dismissAdminNotification,
} from '../services/notificationService';
import { buildWhatsAppUrl, CLIENT_PLACEHOLDER_INFO, SHOWROOM_SLOTS } from '../data/showroomPlaceholders';
import MagneticButton from '../components/ui/MagneticButton';
import AdminOrdersTab from '../components/admin/AdminOrdersTab';
import AdminCustomersTab from '../components/admin/AdminCustomersTab';
import AdminReviewsTab from '../components/admin/AdminReviewsTab';
import AdminAnalyticsTab from '../components/admin/AdminAnalyticsTab';
import AdminCouponsTab from '../components/admin/AdminCouponsTab';
import AdminHomepageCmsTab from '../components/admin/AdminHomepageCmsTab';
import AdminCommunityTab from '../components/admin/AdminCommunityTab';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import PageSeo from '../components/seo/PageSeo';
import MediaUploader from '../components/admin/MediaUploader';
import ModelUploader from '../components/admin/ModelUploader';
import InventoryEditor from '../components/admin/InventoryEditor';
import InventoryDashboard from '../components/admin/InventoryDashboard';
import AdminNotificationBell from '../components/notifications/AdminNotificationBell';
import './AdminPage.css';

const STATUS_FILTER_TABS = [
  { id: 'all', label: 'All Enquiries' },
  ...ENQUIRY_STATUSES,
];

const EMPTY_PRODUCT_FORM = {
  slotCode: '',
  brand: 'AXOR Helmets',
  category: 'Apex Series',
  title: '',
  subtitle: '',
  summary: '',
  priceLabel: '',
  referenceNote: 'Reference MRP – confirm with showroom',
  image: '',
  images: [],
  model3D: { enabled: false, url: '', storagePath: '', format: 'glb' },
  inventory: { trackingEnabled: false, lowStockThreshold: 2, quantity: '', variants: [] },
  certification: '',
  shellSpec: '',
  weightSpec: '',
  visorSpec: '',
  ventilationSpec: '',
  retentionSpec: '',
  fitNote: '',
  highlights: '',
  accentColor: '#e11d2a',
  previewFinish: 'obsidian-carbon',
  visible: true,
  order: 0,
};

function formatEnquiryDate(createdAt) {
  if (!createdAt) return 'Just now';
  const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function buildCustomerContactActions(enquiry) {
  const raw = (enquiry.contact || '').trim();
  const actions = [];

  if (raw.includes('@')) {
    const subject = `Re: Your ${enquiry.topic} Enquiry — ${CLIENT_PLACEHOLDER_INFO.brandName} ${CLIENT_PLACEHOLDER_INFO.locationLabel}`;
    const body = `Hi ${enquiry.name},\n\nThank you for contacting ${CLIENT_PLACEHOLDER_INFO.brandName} — ${CLIENT_PLACEHOLDER_INFO.locationLabel} regarding "${enquiry.topic}".\n\n`;
    actions.push({
      key: 'email',
      label: 'Email',
      href: `mailto:${raw}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      external: false,
      icon: Mail,
    });
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 10 && digits.length <= 15) {
    const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;
    const replyMsg = `Hi ${enquiry.name}, thank you for contacting ${CLIENT_PLACEHOLDER_INFO.brandName} (${CLIENT_PLACEHOLDER_INFO.locationLabel}) regarding ${enquiry.topic}.`;
    actions.push({
      key: 'call',
      label: 'Call',
      href: `tel:+${normalizedPhone}`,
      external: false,
      icon: Phone,
    });
    actions.push({
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(replyMsg)}`,
      external: true,
      icon: WhatsAppIcon,
    });
  } else if (actions.length === 0) {
    actions.push({
      key: 'showroom-wa',
      label: 'Open WhatsApp',
      href: buildWhatsAppUrl(`Follow-up for ${enquiry.name} (${enquiry.contact})`),
      external: true,
      icon: WhatsAppIcon,
    });
  }

  return actions;
}

// ─────────────────────────────────────────────
// Product Form Component
// ─────────────────────────────────────────────
function ProductForm({ initial, onSave, onCancel, saving, saveError }) {
  const [form, setForm] = useState(() => {
    if (!initial) return EMPTY_PRODUCT_FORM;
    // Normalize images: if legacy has single `image`, seed it as first gallery item
    const initialImages = Array.isArray(initial.images) && initial.images.length > 0
      ? initial.images
      : initial.image
        ? [{ url: initial.image, alt: initial.title || 'Product Image', isPrimary: true, sortOrder: 0 }]
        : [];

    return {
      ...EMPTY_PRODUCT_FORM,
      ...initial,
      images: initialImages,
      model3D: initial.model3D || { enabled: false, url: '', storagePath: '', format: 'glb' },
      inventory: initial.inventory || {
        trackingEnabled: false,
        lowStockThreshold: 2,
        quantity: '',
        variants: [],
      },
      highlights: Array.isArray(initial.highlights)
        ? initial.highlights.join('\n')
        : (initial.highlights || ''),
      visible: initial.visible !== false,
    };
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleImagesChange = (updatedImages) => {
    const primary = updatedImages.find((img) => img.isPrimary) || updatedImages[0];
    setForm((prev) => ({
      ...prev,
      images: updatedImages,
      image: primary ? primary.url : prev.image,
    }));
  };

  const handleModelChange = (updatedModel) => {
    setForm((prev) => ({
      ...prev,
      model3D: updatedModel,
    }));
  };

  const handleInventoryChange = (updatedInventory) => {
    setForm((prev) => ({
      ...prev,
      inventory: updatedInventory,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const primaryImg = form.images.find((img) => img.isPrimary) || form.images[0];
    const resolvedHero = primaryImg?.url || form.image || '';

    const payload = {
      ...form,
      image: resolvedHero,
      highlights: form.highlights
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      visible: Boolean(form.visible),
      order: Number(form.order) || 0,
    };
    onSave(payload);
  };

  return (
    <form className="admin-product-form" onSubmit={handleSubmit} noValidate>
      <div className="admin-product-form__grid">
        <div className="admin-field">
          <label htmlFor="pf-title">Title *</label>
          <input id="pf-title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-subtitle">Subtitle</label>
          <input id="pf-subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-brand">Brand</label>
          <input id="pf-brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-category">Category</label>
          <input id="pf-category" value={form.category} onChange={(e) => set('category', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-slotCode">Slot Code (e.g. AXOR // 01)</label>
          <input id="pf-slotCode" value={form.slotCode} onChange={(e) => set('slotCode', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-priceLabel">Price Label (e.g. ₹5,498)</label>
          <input id="pf-priceLabel" value={form.priceLabel} onChange={(e) => set('priceLabel', e.target.value)} />
        </div>
        <div className="admin-field admin-field--full">
          <label htmlFor="pf-image">Hero Image URL (or upload below) *</label>
          <input id="pf-image" value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="/assets/axor/example.jpg or https://..." required />
        </div>

        {/* Multi-Photo Uploader Component */}
        <div className="admin-field admin-field--full">
          <MediaUploader
            images={form.images}
            onChange={handleImagesChange}
            productId={initial?.id || 'new_product'}
          />
        </div>

        {/* 3D Helmet Model Uploader Component */}
        <div className="admin-field admin-field--full">
          <ModelUploader
            model3D={form.model3D}
            onChange={handleModelChange}
            productId={initial?.id || 'new_product'}
          />
        </div>

        {/* Inventory Editor Component */}
        <div className="admin-field admin-field--full">
          <InventoryEditor
            inventory={form.inventory}
            onChange={handleInventoryChange}
          />
        </div>

        <div className="admin-field admin-field--full">
          <label htmlFor="pf-summary">Summary</label>
          <textarea id="pf-summary" rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
        </div>
        <div className="admin-field admin-field--full">
          <label htmlFor="pf-highlights">Highlights (one per line)</label>
          <textarea id="pf-highlights" rows={5} value={form.highlights} onChange={(e) => set('highlights', e.target.value)} placeholder="Feature one&#10;Feature two&#10;Feature three" />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-certification">Certification</label>
          <input id="pf-certification" value={form.certification} onChange={(e) => set('certification', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-shellSpec">Shell Spec</label>
          <input id="pf-shellSpec" value={form.shellSpec} onChange={(e) => set('shellSpec', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-weightSpec">Weight</label>
          <input id="pf-weightSpec" value={form.weightSpec} onChange={(e) => set('weightSpec', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-visorSpec">Visor</label>
          <input id="pf-visorSpec" value={form.visorSpec} onChange={(e) => set('visorSpec', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-ventilationSpec">Ventilation</label>
          <input id="pf-ventilationSpec" value={form.ventilationSpec} onChange={(e) => set('ventilationSpec', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-retentionSpec">Retention</label>
          <input id="pf-retentionSpec" value={form.retentionSpec} onChange={(e) => set('retentionSpec', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-fitNote">Fit Note</label>
          <input id="pf-fitNote" value={form.fitNote} onChange={(e) => set('fitNote', e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-accentColor">Accent Color (hex)</label>
          <div className="admin-color-row">
            <input id="pf-accentColor" value={form.accentColor} onChange={(e) => set('accentColor', e.target.value)} />
            <input type="color" aria-label="Pick accent color" value={form.accentColor} onChange={(e) => set('accentColor', e.target.value)} className="admin-color-swatch" />
          </div>
        </div>
        <div className="admin-field">
          <label htmlFor="pf-previewFinish">Preview Finish ID</label>
          <input id="pf-previewFinish" value={form.previewFinish} onChange={(e) => set('previewFinish', e.target.value)} placeholder="obsidian-carbon | crimson-apex | liquid-silver" />
        </div>
        <div className="admin-field">
          <label htmlFor="pf-order">Display Order</label>
          <input id="pf-order" type="number" min={0} value={form.order} onChange={(e) => set('order', e.target.value)} />
        </div>
        <div className="admin-field">
          <label className="admin-checkbox-label">
            <input type="checkbox" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} />
            Visible in public showroom
          </label>
        </div>
      </div>

      {saveError && (
        <p className="admin-alert admin-alert--error" role="alert">
          <ShieldAlert size={16} aria-hidden="true" />
          <span>{saveError}</span>
        </p>
      )}

      <div className="admin-product-form__actions">
        <MagneticButton type="submit" variant="primary" disabled={saving} icon={saving ? Loader2 : PackagePlus}>
          {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Product'}
        </MagneticButton>
        <button type="button" className="admin-cancel-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// Main Admin Page
// ─────────────────────────────────────────────
export default function AdminPage() {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  const [enquiries, setEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [enquiriesError, setEnquiriesError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [actionError, setActionError] = useState('');

  // Customer Response Notification Modal
  const [respondingEnquiry, setRespondingEnquiry] = useState(null);
  const [responseTitle, setResponseTitle] = useState('BIKER CAFE — Response to Your Enquiry');
  const [responseMessage, setResponseMessage] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responseSuccessMsg, setResponseSuccessMsg] = useState('');

  // ── Showroom products state ──
  const [activeTab, setActiveTab] = useState('enquiries'); // 'enquiries' | 'showroom'
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [productForm, setProductForm] = useState(null); // null | 'add' | product object (edit)
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSaveError, setProductSaveError] = useState('');
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState('');
  const [deletingProductId, setDeletingProductId] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState('');

  const isAuthorizedAdmin = Boolean(user && user.uid === ADMIN_UID);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.uid !== ADMIN_UID) {
        await signOut(auth).catch(() => {});
        setUser(null);
        setEnquiries([]);
        setAuthError(
          'Access denied. Only the authorized BIKER CAFE – ARNI owner account can open this dashboard.'
        );
        setAuthReady(true);
        return;
      }

      setUser(firebaseUser || null);
      if (!firebaseUser) {
        setEnquiries([]);
        setLoadingEnquiries(false);
      } else {
        setAuthError('');
        setLoadingEnquiries(true);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthorizedAdmin) return undefined;

    const unsubscribe = subscribeEnquiries(
      (items) => {
        setEnquiries(items);
        setEnquiriesError('');
        setLoadingEnquiries(false);

        // Synchronize new enquiries into adminNotifications with deterministic IDs
        items.forEach((item) => {
          if (item.status === 'new') {
            syncAdminEnquiryNotification(item).catch(() => {});
          }
        });
      },
      (err) => {
        setEnquiriesError(
          err?.code === 'permission-denied'
            ? 'Firestore permission denied. Confirm firestore.rules are published for the owner UID.'
            : 'Unable to load enquiries from Firestore.'
        );
        setLoadingEnquiries(false);
      }
    );

    return () => unsubscribe();
  }, [isAuthorizedAdmin]);

  // Load products when showroom or inventory tab is opened
  useEffect(() => {
    if (!isAuthorizedAdmin || (activeTab !== 'showroom' && activeTab !== 'inventory')) return;
    let cancelled = false;
    getAllProducts()
      .then((items) => {
        if (cancelled) return;
        setProducts(items);
        setProductsError('');
        setLoadingProducts(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setProductsError(
          err?.code === 'permission-denied'
            ? 'Permission denied. Deploy the updated firestore.rules first.'
            : 'Failed to load showroom products from Firestore.'
        );
        setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthorizedAdmin, activeTab]);

  const handleGoogleAdminLogin = async () => {
    if (signingIn) return;
    setAuthError('');
    setSigningIn(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth).catch(() => {});
        setAuthError(
          'Access denied. This Google account UID does not match the authorized BIKER CAFE – ARNI owner UID.'
        );
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setAuthError(err?.message || 'Google sign-in failed. Please try again or use owner email/password.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (signingIn) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Enter both your owner email and password.');
      return;
    }

    setAuthError('');
    setSigningIn(true);

    try {
      const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth).catch(() => {});
        setAuthError(
          'Access denied. Only the authorized BIKER CAFE – ARNI owner account can open this dashboard.'
        );
      } else {
        setPassword('');
      }
    } catch (err) {
      const code = err?.code || '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found' ||
        code === 'auth/invalid-email'
      ) {
        setAuthError('Invalid owner email or password.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Too many failed sign-in attempts. Please wait a moment and try again.');
      } else {
        setAuthError('Sign-in failed. Check your connection and try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setActionError('');
    setConfirmDeleteId('');
    await signOut(auth);
  };

  const handleStatusChange = async (enquiryId, nextStatus) => {
    setActionError('');
    setUpdatingId(enquiryId);
    try {
      await updateEnquiryStatus(enquiryId, nextStatus);
      if (nextStatus === 'resolved') {
        await dismissAdminNotification(enquiryId);
      }
    } catch {
      setActionError('Failed to update enquiry status. Check permissions and connection.');
    } finally {
      setUpdatingId('');
    }
  };

  const handleConfirmDelete = async (enquiryId) => {
    setActionError('');
    setDeletingId(enquiryId);
    try {
      await deleteEnquiry(enquiryId);
      setConfirmDeleteId('');
    } catch {
      setActionError('Failed to delete enquiry. Check permissions and connection.');
    } finally {
      setDeletingId('');
    }
  };

  const handleSendResponseNotification = async (e) => {
    e.preventDefault();
    if (!respondingEnquiry || !respondingEnquiry.userId) return;
    if (!responseMessage.trim()) {
      setActionError('Please enter a response message for the customer.');
      return;
    }

    setSendingResponse(true);
    setActionError('');
    try {
      await sendCustomerEnquiryResponse({
        userId: respondingEnquiry.userId,
        enquiryId: respondingEnquiry.id,
        title: responseTitle.trim(),
        message: responseMessage.trim(),
        adminNotes: responseNotes.trim(),
      });
      // Update enquiry status to resolved and dismiss notification alert
      await updateEnquiryStatus(respondingEnquiry.id, 'resolved');
      await dismissAdminNotification(respondingEnquiry.id);
      setResponseSuccessMsg(`Response notification sent to ${respondingEnquiry.name || 'customer'}!`);
      setRespondingEnquiry(null);
      setResponseMessage('');
      setResponseNotes('');
      setTimeout(() => setResponseSuccessMsg(''), 4000);
    } catch (err) {
      setActionError(`Failed to send response notification: ${err.message}`);
    } finally {
      setSendingResponse(false);
    }
  };

  // ── Product handlers ──
  const reloadProducts = async () => {
    setLoadingProducts(true);
    try {
      const items = await getAllProducts();
      setProducts(items);
      setProductsError('');
    } catch {
      setProductsError('Failed to reload products.');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSaveProduct = async (formData) => {
    setSavingProduct(true);
    setProductSaveError('');
    try {
      if (productForm && productForm !== 'add') {
        await updateProduct(productForm.id, formData);
      } else {
        await addProduct(formData);
      }
      setProductForm(null);
      await reloadProducts();
    } catch (err) {
      setProductSaveError(
        err?.code === 'permission-denied'
          ? 'Permission denied. Deploy firestore.rules with showroomProducts write access.'
          : 'Failed to save product. Check connection.'
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    setDeletingProductId(productId);
    try {
      await deleteProduct(productId);
      setConfirmDeleteProductId('');
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      setProductsError('Failed to delete product. Check permissions.');
    } finally {
      setDeletingProductId('');
    }
  };

  const handleSeedProducts = async () => {
    setSeeding(true);
    setSeedResult('');
    setProductsError('');
    try {
      const count = await seedProductsIfEmpty(SHOWROOM_SLOTS);
      if (count === 0) {
        setSeedResult('Showroom already has products — seed skipped to avoid duplicates.');
      } else {
        setSeedResult(`${count} default AXOR products seeded successfully.`);
        await reloadProducts();
      }
    } catch (err) {
      setProductsError(
        err?.code === 'permission-denied'
          ? 'Permission denied. Deploy firestore.rules first, then retry seed.'
          : 'Failed to seed products. Check connection and rules.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const counts = useMemo(() => {
    const summary = { all: enquiries.length, new: 0, 'in-progress': 0, resolved: 0 };
    for (const item of enquiries) {
      const st = item.status || 'new';
      if (Object.hasOwn(summary, st)) {
        summary[st] += 1;
      }
    }
    return summary;
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return enquiries.filter((item) => {
      const statusMatches = statusFilter === 'all' || (item.status || 'new') === statusFilter;
      if (!statusMatches) return false;
      if (!q) return true;
      const haystack = `${item.name || ''} ${item.contact || ''} ${item.topic || ''} ${
        item.message || ''
      } ${item.id || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [enquiries, searchTerm, statusFilter]);

  return (
    <div className="admin-page">
      <PageSeo
        title="Owner Portal | BIKER CAFE — ARNI"
        description="Private showroom owner enquiry management dashboard."
        robots="noindex, nofollow"
      />
      <section className="admin-hero">
        <div className="container">
          <span className="eyebrow">
            {CLIENT_PLACEHOLDER_INFO.brandName} // {CLIENT_PLACEHOLDER_INFO.locationLabel} Owner Portal
          </span>
          <div className="admin-hero__row">
            <div>
              <h1 className="admin-hero__title">
                OWNER <span className="metallic-text">DASHBOARD</span>
              </h1>
              <p className="admin-hero__copy">
                Private showroom console secured by Firebase Authentication &amp; UID-locked Firestore
                rules.
              </p>
            </div>
            {isAuthorizedAdmin && (
              <div className="admin-hero__user">
                <AdminNotificationBell
                  onSelectEnquiry={(enquiryId) => {
                    setActiveTab('enquiries');
                    setSearchTerm(enquiryId);
                  }}
                />
                <span className="admin-hero__badge">
                  <ShieldCheck size={15} aria-hidden="true" />
                  Verified Owner ({user.email || ADMIN_UID})
                </span>
                <button type="button" className="admin-signout-btn" onClick={handleSignOut}>
                  <LogOut size={15} aria-hidden="true" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="admin-body section-pad">
        <div className="container">
          {!authReady ? (
            <div className="admin-state-card">
              <Loader2 size={24} className="admin-spin" aria-hidden="true" />
              <p>Verifying owner session...</p>
            </div>
          ) : !isAuthorizedAdmin ? (
            <div className="admin-login-card">
              <div className="admin-login-card__head">
                <span className="admin-login-card__icon" aria-hidden="true">
                  <Lock size={20} />
                </span>
                <div>
                  <h2>Owner Sign In</h2>
                  <p>Sign in with your authorized Firebase owner account to manage enquiries.</p>
                </div>
              </div>

              <form className="admin-login-form" onSubmit={handleLogin} noValidate>
                <div className="admin-field">
                  <label htmlFor="admin-email">Owner Email</label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    placeholder="Bikercafearni97@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setAuthError('');
                      setEmail(e.target.value);
                    }}
                    disabled={signingIn}
                    required
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setAuthError('');
                      setPassword(e.target.value);
                    }}
                    disabled={signingIn}
                    required
                  />
                </div>

                {authError && (
                  <p className="admin-alert admin-alert--error" role="alert">
                    <ShieldAlert size={16} aria-hidden="true" />
                    <span>{authError}</span>
                  </p>
                )}

                <MagneticButton
                  type="submit"
                  variant="primary"
                  disabled={signingIn}
                  icon={signingIn ? Loader2 : Lock}
                >
                  {signingIn ? 'Signing In...' : 'Access Owner Dashboard'}
                </MagneticButton>

                <div className="admin-login-divider">
                  <span>OR</span>
                </div>

                <button
                  type="button"
                  className="admin-google-btn"
                  onClick={handleGoogleAdminLogin}
                  disabled={signingIn}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In with Owner Google Account</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="admin-dashboard">
              {/* ── Tab Navigation ── */}
              <div className="admin-tab-nav" role="tablist" aria-label="Dashboard sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'orders'}
                  className={`admin-tab-btn ${activeTab === 'orders' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <ShoppingBag size={16} aria-hidden="true" />
                  Order Management
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'customers'}
                  className={`admin-tab-btn ${activeTab === 'customers' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('customers')}
                >
                  <ShieldCheck size={16} aria-hidden="true" />
                  Customer Directory
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'reviews'}
                  className={`admin-tab-btn ${activeTab === 'reviews' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('reviews')}
                >
                  <Star size={16} aria-hidden="true" />
                  Product Reviews
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'analytics'}
                  className={`admin-tab-btn ${activeTab === 'analytics' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  <TrendingUp size={16} aria-hidden="true" />
                  Sales &amp; Analytics
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'coupons'}
                  className={`admin-tab-btn ${activeTab === 'coupons' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('coupons')}
                >
                  <Tag size={16} aria-hidden="true" />
                  Coupons &amp; Offers
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'cms'}
                  className={`admin-tab-btn ${activeTab === 'cms' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('cms')}
                >
                  <Sparkles size={16} aria-hidden="true" />
                  Homepage CMS
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'community'}
                  className={`admin-tab-btn ${activeTab === 'community' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('community')}
                >
                  <Users size={16} aria-hidden="true" />
                  Rider Community
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'enquiries'}
                  className={`admin-tab-btn ${activeTab === 'enquiries' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('enquiries')}
                >
                  <Inbox size={16} aria-hidden="true" />
                  Customer Enquiries
                  {counts.new > 0 && (
                    <span className="admin-tab-badge">{counts.new}</span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'showroom'}
                  className={`admin-tab-btn ${activeTab === 'showroom' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('showroom')}
                >
                  <Layers size={16} aria-hidden="true" />
                  Manage Showroom
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'inventory'}
                  className={`admin-tab-btn ${activeTab === 'inventory' ? 'admin-tab-btn--active' : ''}`}
                  onClick={() => setActiveTab('inventory')}
                >
                  <Package size={16} aria-hidden="true" />
                  Inventory Management
                </button>
              </div>

              {/* ── Orders Tab (Stage 6.8) ── */}
              {activeTab === 'orders' && <AdminOrdersTab />}

              {/* ── Customers Tab (Stage 6.9) ── */}
              {activeTab === 'customers' && <AdminCustomersTab />}

              {/* ── Reviews Tab (Stage 6.10) ── */}
              {activeTab === 'reviews' && <AdminReviewsTab />}

              {/* ── Analytics Tab (Stage 6.11) ── */}
              {activeTab === 'analytics' && <AdminAnalyticsTab />}

              {/* ── Coupons Tab (Stage 6.12) ── */}
              {activeTab === 'coupons' && <AdminCouponsTab />}

              {/* ── Homepage CMS Tab (Stage 6.13) ── */}
              {activeTab === 'cms' && <AdminHomepageCmsTab />}

              {/* ── Rider Community Tab (Stage 6.14) ── */}
              {activeTab === 'community' && <AdminCommunityTab />}

              {/* ── Enquiries Tab ── */}
              {activeTab === 'enquiries' && (
                <>
                  {/* Summary Metrics */}
                  <div className="admin-stats-grid">
                    <div className="admin-stat-card">
                      <span className="admin-stat-card__label">Total Enquiries</span>
                      <strong className="admin-stat-card__val">{counts.all}</strong>
                    </div>
                    <div className="admin-stat-card admin-stat-card--new">
                      <span className="admin-stat-card__label">New</span>
                      <strong className="admin-stat-card__val">{counts.new}</strong>
                    </div>
                    <div className="admin-stat-card admin-stat-card--progress">
                      <span className="admin-stat-card__label">In Progress</span>
                      <strong className="admin-stat-card__val">{counts['in-progress']}</strong>
                    </div>
                    <div className="admin-stat-card admin-stat-card--resolved">
                      <span className="admin-stat-card__label">Resolved</span>
                      <strong className="admin-stat-card__val">{counts.resolved}</strong>
                    </div>
                  </div>

                  {/* Search & Status Filters */}
                  <div className="admin-toolbar">
                    <div className="admin-search">
                      <Search size={16} aria-hidden="true" />
                      <input
                        type="search"
                        aria-label="Search enquiries"
                        placeholder="Search by customer name, phone/email, category, or message..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="admin-filter-tabs" role="tablist" aria-label="Filter by status">
                      {STATUS_FILTER_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={statusFilter === tab.id}
                          className={`admin-filter-tab ${
                            statusFilter === tab.id ? 'admin-filter-tab--active' : ''
                          }`}
                          onClick={() => setStatusFilter(tab.id)}
                        >
                          <span>{tab.label}</span>
                          <span className="admin-filter-tab__count">{counts[tab.id] ?? 0}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(enquiriesError || actionError) && (
                    <div className="admin-alert admin-alert--error" role="alert">
                      <ShieldAlert size={16} aria-hidden="true" />
                      <span>{enquiriesError || actionError}</span>
                    </div>
                  )}

                  {responseSuccessMsg && (
                    <div className="admin-alert admin-alert--success" role="status">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{responseSuccessMsg}</span>
                    </div>
                  )}

                  {/* Customer Response Modal */}
                  {respondingEnquiry && (
                    <div className="admin-modal-backdrop" onClick={() => setRespondingEnquiry(null)}>
                      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal__head">
                          <h3>Notify Customer: {respondingEnquiry.name}</h3>
                          <button
                            type="button"
                            className="admin-modal__close"
                            onClick={() => setRespondingEnquiry(null)}
                          >
                            &times;
                          </button>
                        </div>

                        <form onSubmit={handleSendResponseNotification} className="admin-modal__body">
                          <p className="admin-modal__desc">
                            This will create a real-time account notification for <strong>{respondingEnquiry.name}</strong> ({respondingEnquiry.contact}).
                          </p>

                          <div className="admin-modal__field">
                            <label htmlFor="resp-title" className="admin-modal__label">
                              Notification Title
                            </label>
                            <input
                              id="resp-title"
                              type="text"
                              value={responseTitle}
                              onChange={(e) => setResponseTitle(e.target.value)}
                              className="admin-inv-input"
                              required
                            />
                          </div>

                          <div className="admin-modal__field">
                            <label htmlFor="resp-msg" className="admin-modal__label">
                              Response Message *
                            </label>
                            <textarea
                              id="resp-msg"
                              rows={3}
                              value={responseMessage}
                              onChange={(e) => setResponseMessage(e.target.value)}
                              placeholder="e.g. We have checked availability for your requested helmet. Sizing and finish details..."
                              className="admin-inv-input"
                              required
                            />
                          </div>

                          <div className="admin-modal__field">
                            <label htmlFor="resp-notes" className="admin-modal__label">
                              Showroom Notes / Instructions (Optional)
                            </label>
                            <input
                              id="resp-notes"
                              type="text"
                              value={responseNotes}
                              onChange={(e) => setResponseNotes(e.target.value)}
                              placeholder="e.g. Please visit our Arni showroom or message our WhatsApp for quick pickup."
                              className="admin-inv-input"
                            />
                          </div>

                          <div className="admin-modal__actions">
                            <button
                              type="button"
                              className="admin-modal__btn admin-modal__btn--cancel"
                              onClick={() => setRespondingEnquiry(null)}
                              disabled={sendingResponse}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="admin-modal__btn admin-modal__btn--submit"
                              disabled={sendingResponse}
                            >
                              {sendingResponse ? <Loader2 size={14} className="admin-inv-spin" /> : null}
                              <span>{sendingResponse ? 'Sending Notification...' : 'Send Notification & Resolve'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {loadingEnquiries ? (
                    <div className="admin-state-card">
                      <Loader2 size={24} className="admin-spin" aria-hidden="true" />
                      <p>Loading customer enquiries...</p>
                    </div>
                  ) : filteredEnquiries.length === 0 ? (
                    <div className="admin-state-card">
                      <Inbox size={26} aria-hidden="true" />
                      <p>
                        {enquiries.length === 0
                          ? 'No customer enquiries submitted yet.'
                          : 'No enquiries match your current search or status filter.'}
                      </p>
                    </div>
                  ) : (
                    <div className="admin-enquiry-list">
                      {filteredEnquiries.map((item) => {
                        const currentStatus = item.status || 'new';
                        const contactActions = buildCustomerContactActions(item);
                        const isUpdating = updatingId === item.id;
                        const isConfirmingDelete = confirmDeleteId === item.id;
                        const isDeleting = deletingId === item.id;

                        return (
                          <article key={item.id} className="admin-enquiry-card">
                            <div className="admin-enquiry-card__top">
                              <div>
                                <div className="admin-enquiry-card__badges">
                                  <span className={`admin-status-badge admin-status-badge--${currentStatus}`}>
                                    {currentStatus === 'new' && <Sparkles size={12} aria-hidden="true" />}
                                    {currentStatus === 'in-progress' && <Clock3 size={12} aria-hidden="true" />}
                                    {currentStatus === 'resolved' && <CheckCircle2 size={12} aria-hidden="true" />}
                                    {ENQUIRY_STATUSES.find((s) => s.id === currentStatus)?.label ||
                                      currentStatus}
                                  </span>
                                  <span className="admin-topic-badge">{item.topic}</span>
                                </div>
                                <h2 className="admin-enquiry-card__name">{item.name}</h2>
                                <p className="admin-enquiry-card__contact">{item.contact}</p>
                              </div>

                              <div className="admin-enquiry-card__meta">
                                <span>{formatEnquiryDate(item.createdAt)}</span>
                                <span className="admin-enquiry-card__id">ID: {item.id.slice(0, 8)}</span>
                              </div>
                            </div>

                            <p className="admin-enquiry-card__message">{item.message}</p>

                            <div className="admin-enquiry-card__footer">
                              <div className="admin-contact-actions">
                                {contactActions.map((act) => {
                                  const ActionIcon = act.icon;
                                  return (
                                    <a
                                      key={act.key}
                                      href={act.href}
                                      target={act.external ? '_blank' : undefined}
                                      rel={act.external ? 'noopener noreferrer' : undefined}
                                      className="admin-action-link"
                                    >
                                      <ActionIcon size={14} aria-hidden="true" />
                                      <span>{act.label}</span>
                                    </a>
                                  );
                                })}
                              </div>

                              <div className="admin-workflow-actions">
                                <label className="admin-status-select-wrap">
                                  <span className="sr-only">Update status for {item.name}</span>
                                  <select
                                    value={currentStatus}
                                    disabled={isUpdating || isDeleting}
                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                    className="admin-status-select"
                                  >
                                    {ENQUIRY_STATUSES.map((st) => (
                                      <option key={st.id} value={st.id}>
                                        {st.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                {item.userId ? (
                                  <button
                                    type="button"
                                    className="admin-action-link"
                                    onClick={() => {
                                      setRespondingEnquiry(item);
                                      setResponseTitle(`Re: ${item.topic} — BIKER CAFE Response`);
                                      setResponseMessage('');
                                      setResponseNotes('');
                                    }}
                                    title="Send account notification to this logged-in customer"
                                  >
                                    <Mail size={14} />
                                    <span>Notify Customer</span>
                                  </button>
                                ) : (
                                  <span className="admin-anon-tag" title="Submitted as guest — no user account attached">
                                    Guest
                                  </span>
                                )}

                                {!isConfirmingDelete ? (
                                  <button
                                    type="button"
                                    className="admin-delete-btn"
                                    disabled={isUpdating || isDeleting}
                                    onClick={() => setConfirmDeleteId(item.id)}
                                  >
                                    <Trash2 size={14} aria-hidden="true" />
                                    <span>Delete</span>
                                  </button>
                                ) : (
                                  <div className="admin-delete-confirm">
                                    <span>Delete permanently?</span>
                                    <button
                                      type="button"
                                      className="admin-delete-confirm__yes"
                                      disabled={isDeleting}
                                      onClick={() => handleConfirmDelete(item.id)}
                                    >
                                      {isDeleting ? 'Deleting...' : 'Confirm'}
                                    </button>
                                    <button
                                      type="button"
                                      className="admin-delete-confirm__cancel"
                                      disabled={isDeleting}
                                      onClick={() => setConfirmDeleteId('')}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── Showroom Management Tab ── */}
              {activeTab === 'showroom' && (
                <div className="admin-showroom">
                  <div className="admin-showroom__header">
                    <div>
                      <h2 className="admin-showroom__title">Showroom Products</h2>
                      <p className="admin-showroom__sub">
                        Manage the helmet catalogue. Changes are reflected on the public showroom after
                        deploying updated Firestore rules.
                      </p>
                    </div>
                    <div className="admin-showroom__actions">
                      <button
                        type="button"
                        className="admin-seed-btn"
                        onClick={handleSeedProducts}
                        disabled={seeding}
                        title="Import the 6 default AXOR products if showroom is empty"
                      >
                        {seeding ? <Loader2 size={15} className="admin-spin" /> : <Sparkles size={15} />}
                        {seeding ? 'Seeding...' : 'Seed Default Products'}
                      </button>
                      <MagneticButton
                        type="button"
                        variant="primary"
                        icon={PackagePlus}
                        onClick={() => {
                          setProductForm('add');
                          setProductSaveError('');
                        }}
                      >
                        Add Product
                      </MagneticButton>
                    </div>
                  </div>

                  {seedResult && (
                    <p className="admin-alert admin-alert--success" role="status">
                      <Sparkles size={15} aria-hidden="true" />
                      <span>{seedResult}</span>
                    </p>
                  )}

                  {productsError && (
                    <p className="admin-alert admin-alert--error" role="alert">
                      <ShieldAlert size={16} aria-hidden="true" />
                      <span>{productsError}</span>
                    </p>
                  )}

                  {/* Add / Edit Form */}
                  {productForm !== null && (
                    <div className="admin-product-form-wrap">
                      <div className="admin-product-form-wrap__head">
                        <h3>{productForm === 'add' ? 'Add New Product' : `Edit: ${productForm.title}`}</h3>
                        <button
                          type="button"
                          className="admin-cancel-btn admin-cancel-btn--icon"
                          aria-label="Close form"
                          onClick={() => setProductForm(null)}
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <ProductForm
                        initial={productForm !== 'add' ? productForm : null}
                        onSave={handleSaveProduct}
                        onCancel={() => setProductForm(null)}
                        saving={savingProduct}
                        saveError={productSaveError}
                      />
                    </div>
                  )}

                  {loadingProducts ? (
                    <div className="admin-state-card">
                      <Loader2 size={24} className="admin-spin" aria-hidden="true" />
                      <p>Loading showroom products...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="admin-state-card">
                      <Layers size={26} aria-hidden="true" />
                      <p>No products in Firestore yet. Use &ldquo;Seed Default Products&rdquo; to import the 6 AXOR helmets, or add products manually.</p>
                    </div>
                  ) : (
                    <div className="admin-product-list">
                      {products.map((product) => {
                        const isConfirmingDel = confirmDeleteProductId === product.id;
                        const isDeleting = deletingProductId === product.id;
                        return (
                          <div key={product.id} className="admin-product-row">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="admin-product-row__img"
                                loading="lazy"
                                width={56}
                                height={56}
                              />
                            )}
                            <div className="admin-product-row__info">
                              <span className="admin-product-row__title">{product.title}</span>
                              <span className="admin-product-row__meta">
                                {product.category} · {product.priceLabel || '—'}
                              </span>
                            </div>
                            <span
                              className={`admin-product-row__badge ${
                                product.visible ? 'admin-product-row__badge--visible' : 'admin-product-row__badge--hidden'
                              }`}
                            >
                              {product.visible ? 'Visible' : 'Hidden'}
                            </span>
                            <div className="admin-product-row__btns">
                              <button
                                type="button"
                                className="admin-action-link"
                                onClick={() => {
                                  setProductForm(product);
                                  setProductSaveError('');
                                }}
                              >
                                <Pencil size={14} aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              {!isConfirmingDel ? (
                                <button
                                  type="button"
                                  className="admin-delete-btn"
                                  disabled={isDeleting}
                                  onClick={() => setConfirmDeleteProductId(product.id)}
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  <span>Delete</span>
                                </button>
                              ) : (
                                <div className="admin-delete-confirm">
                                  <span>Delete?</span>
                                  <button
                                    type="button"
                                    className="admin-delete-confirm__yes"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteProduct(product.id)}
                                  >
                                    {isDeleting ? 'Deleting...' : 'Confirm'}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-delete-confirm__cancel"
                                    disabled={isDeleting}
                                    onClick={() => setConfirmDeleteProductId('')}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Inventory Management Tab ── */}
              {activeTab === 'inventory' && (
                <div className="admin-inventory-section">
                  <div className="admin-showroom__header">
                    <div>
                      <h2 className="admin-showroom__title">Inventory Management</h2>
                      <p className="admin-showroom__sub">
                        Track showroom stock units, manage sizing variants, record manual adjustments, and audit transaction logs.
                      </p>
                    </div>
                  </div>

                  <InventoryDashboard
                    products={products}
                    onProductUpdated={reloadProducts}
                    adminUid={user?.uid || ADMIN_UID}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
