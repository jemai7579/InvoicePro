import React, { createContext, useContext, useState, useCallback } from 'react';

import translations from '../i18n/translations';

const LanguageContext = createContext();

const runtimeOverrides = {
  fr: {
    search: {
      placeholder: 'Rechercher une page ou une action…',
      suggestions: 'Suggestions',
      noResults: 'Aucun résultat pour',
    },
    common: {
      search: 'Rechercher',
      import: 'Importer',
      loading: 'Chargement…',
    },
    nav: {
      projects: 'Mes Projets',
      quotes: 'Mes Devis',
      tracking: 'Suivi de factures',
    },
    auth: {
      rc: 'RNE',
      placeholder: {
        registreCommerce: 'RNE de l’entreprise',
      },
    },
    form: {
      rc: 'RNE',
    },
    settings: {
      profile: {
        rc: 'RNE',
      },
    },
    projectsPage: {
      title: 'Mes projets',
      subtitle: 'Préparez un besoin client, envoyez-le et transformez-le ensuite en devis.',
      new: 'Créer un projet',
      draft: 'Brouillons',
      sent: 'Envoyés',
      accepted: 'Acceptés',
      received: 'Projets reçus',
      empty: 'Aucun projet pour le moment.',
      sendPlatform: 'Envoyer via la plateforme',
      sendEmail: 'Envoyer par email',
      createDevis: 'Créer un devis',
      fields: {
        title: 'Titre du projet',
        client: 'Client / société cible',
        description: 'Description',
        estimatedNeeds: 'Besoins estimés',
        optionalBudget: 'Budget estimatif',
        deadline: 'Échéance',
      },
    },
    trackingPage: {
      title: 'Suivi de factures',
      subtitle: 'Visualisez l’avancement de chaque facture de façon claire et rassurante.',
      empty: 'Aucune facture à suivre pour le moment.',
      exported: 'Export TEIF / XML disponible',
    },
    dashboard: {
      workflowButton: 'Voir le workflow',
    },
    teif: {
      title: 'TEIF / XML',
      subtitle: 'Préparez, contrôlez et exportez vos documents électroniques sans quitter la plateforme.',
      signature_active: 'Signature électronique active',
      signature_active_desc: 'Votre certificat est prêt pour signer et soumettre les documents TEIF.',
      signature_inactive: 'Signature électronique inactive',
      signature_inactive_desc: 'Configurez votre certificat pour activer l’envoi et la signature TEIF.',
      error_xml: 'Impossible de charger le fichier XML.',
      error_cert: 'Veuillez configurer un certificat avant l’envoi TEIF.',
      error_ttn: 'Impossible d’envoyer ce document vers TTN.',
      status: {
        not_sent: 'Non envoyé',
        sent: 'Envoyé',
        accepted: 'Accepté',
        rejected: 'Rejeté',
      },
      stepper: {
        xml: 'XML',
        sign: 'Signature',
        ttn: 'TTN',
      },
      modal: {
        preview_title: 'Aperçu du fichier XML',
        preview_desc: 'Vérifiez le contenu avant export ou envoi.',
        import_title: 'Importer un fichier XML',
        import_desc: 'Ajoutez un fichier conforme pour l’archiver ou le vérifier.',
      },
      import: {
        drop_zone: 'Glissez un fichier XML ici ou cliquez pour le sélectionner.',
        max_size: 'Format XML uniquement',
        error: 'Import XML impossible.',
        error_format: 'Veuillez sélectionner un fichier XML valide.',
        success: 'Fichier XML importé avec succès.',
      },
      table: {
        ref_client: 'Référence / Client',
        compliance: 'Conformité',
        actions: 'Actions',
        no_docs: 'Aucun document TEIF disponible.',
        tooltip_preview: 'Aperçu XML',
        tooltip_download: 'Télécharger le XML',
      },
      details: {
        net_amount: 'Montant net',
        ttn_archive: 'Archive TTN',
        algorithm: 'Algorithme',
        last_action: 'Dernière action',
        action_finalized: 'Vérification terminée',
      },
      card: {
        config_now: 'Configurer maintenant',
      },
      quick_stat: {
        title: 'Documents validés',
        validated: 'validés',
      },
      footer: {
        title: 'Conformité TEIF maîtrisée',
      },
      banner: {
        desc: 'Gardez la fonctionnalité TEIF disponible en toute sécurité, même si elle n’apparaît plus dans la navigation principale.',
        button: 'Ouvrir les paramètres',
        learn_more: 'En savoir plus',
      },
    },
  },
  en: {
    search: {
      placeholder: 'Search a page or action…',
      suggestions: 'Suggestions',
      noResults: 'No result for',
    },
    common: {
      search: 'Search',
      import: 'Import',
      loading: 'Loading…',
    },
    nav: {
      projects: 'My Projects',
      quotes: 'My Quotes',
      tracking: 'Invoice Tracking',
    },
    auth: {
      rc: 'RNE',
      placeholder: {
        registreCommerce: 'Company RNE',
      },
    },
    form: {
      rc: 'RNE',
    },
    settings: {
      profile: {
        rc: 'RNE',
      },
    },
    projectsPage: {
      title: 'My projects',
      subtitle: 'Prepare a client request, send it, then convert it into a quote.',
      new: 'Create project',
      draft: 'Drafts',
      sent: 'Sent',
      accepted: 'Accepted',
      received: 'Received projects',
      empty: 'No projects yet.',
      sendPlatform: 'Send in platform',
      sendEmail: 'Send by email',
      createDevis: 'Create quote',
      fields: {
        title: 'Project title',
        client: 'Target client / company',
        description: 'Description',
        estimatedNeeds: 'Estimated needs',
        optionalBudget: 'Estimated budget',
        deadline: 'Deadline',
      },
    },
    trackingPage: {
      title: 'Invoice tracking',
      subtitle: 'Follow the progress of each invoice with a clear timeline.',
      empty: 'No invoices to track yet.',
      exported: 'TEIF / XML exported',
    },
    dashboard: {
      workflowButton: 'View workflow',
    },
    teif: {
      title: 'TEIF / XML',
      subtitle: 'Prepare, review and export your electronic documents safely.',
      signature_active: 'Electronic signature active',
      signature_active_desc: 'Your certificate is ready to sign and submit TEIF documents.',
      signature_inactive: 'Electronic signature inactive',
      signature_inactive_desc: 'Configure your certificate to enable TEIF signing and submission.',
      error_xml: 'Unable to load the XML file.',
      error_cert: 'Please configure a certificate before TEIF submission.',
      error_ttn: 'Unable to submit this document to TTN.',
      status: {
        not_sent: 'Not sent',
        sent: 'Sent',
        accepted: 'Accepted',
        rejected: 'Rejected',
      },
      stepper: {
        xml: 'XML',
        sign: 'Sign',
        ttn: 'TTN',
      },
      modal: {
        preview_title: 'XML preview',
        preview_desc: 'Review the content before export or submission.',
        import_title: 'Import an XML file',
        import_desc: 'Upload a compliant XML file to archive or review it.',
      },
      import: {
        drop_zone: 'Drop an XML file here or click to select one.',
        max_size: 'XML format only',
        error: 'Unable to import XML.',
        error_format: 'Please select a valid XML file.',
        success: 'XML file imported successfully.',
      },
      table: {
        ref_client: 'Reference / Client',
        compliance: 'Compliance',
        actions: 'Actions',
        no_docs: 'No TEIF document available.',
        tooltip_preview: 'Preview XML',
        tooltip_download: 'Download XML',
      },
      details: {
        net_amount: 'Net amount',
        ttn_archive: 'TTN archive',
        algorithm: 'Algorithm',
        last_action: 'Last action',
        action_finalized: 'Check completed',
      },
      card: {
        config_now: 'Configure now',
      },
      quick_stat: {
        title: 'Validated documents',
        validated: 'validated',
      },
      footer: {
        title: 'TEIF compliance under control',
      },
      banner: {
        desc: 'Keep TEIF safely available in the application, even if it is hidden from the main sidebar.',
        button: 'Open settings',
        learn_more: 'Learn more',
      },
    },
  },
  ar: {
    search: {
      placeholder: 'ابحث عن صفحة أو إجراء…',
      suggestions: 'اقتراحات',
      noResults: 'لا توجد نتائج لـ',
    },
    common: {
      search: 'بحث',
      import: 'استيراد',
      loading: 'جارٍ التحميل…',
    },
    nav: {
      projects: 'مشاريعي',
      quotes: 'عروضي',
      tracking: 'متابعة الفواتير',
    },
    auth: {
      rc: 'RNE',
      placeholder: {
        registreCommerce: 'المعرّف الوطني للمؤسسة RNE',
      },
    },
    form: {
      rc: 'RNE',
    },
    settings: {
      profile: {
        rc: 'RNE',
      },
    },
    projectsPage: {
      title: 'مشاريعي',
      subtitle: 'أنشئ طلب مشروع ثم أرسله وحوّله لاحقًا إلى عرض سعر.',
      new: 'إنشاء مشروع',
      draft: 'مسودات',
      sent: 'مرسلة',
      accepted: 'مقبولة',
      received: 'مشاريع مستلمة',
      empty: 'لا توجد مشاريع حاليًا.',
      sendPlatform: 'إرسال عبر المنصة',
      sendEmail: 'إرسال بالبريد',
      createDevis: 'إنشاء عرض سعر',
      fields: {
        title: 'عنوان المشروع',
        client: 'العميل / الشركة المستهدفة',
        description: 'الوصف',
        estimatedNeeds: 'الاحتياجات المتوقعة',
        optionalBudget: 'الميزانية التقديرية',
        deadline: 'الأجل',
      },
    },
    trackingPage: {
      title: 'متابعة الفواتير',
      subtitle: 'تابع حالة كل فاتورة بطريقة واضحة وسهلة.',
      empty: 'لا توجد فواتير للمتابعة حاليًا.',
      exported: 'تم تصدير TEIF / XML',
    },
    dashboard: {
      workflowButton: 'عرض المسار',
    },
    teif: {
      title: 'TEIF / XML',
      subtitle: 'قم بإعداد ومراجعة وتصدير المستندات الإلكترونية بأمان.',
      signature_active: 'التوقيع الإلكتروني نشط',
      signature_active_desc: 'شهادتك جاهزة لتوقيع وإرسال مستندات TEIF.',
      signature_inactive: 'التوقيع الإلكتروني غير نشط',
      signature_inactive_desc: 'قم بإعداد الشهادة لتفعيل توقيع وإرسال TEIF.',
      error_xml: 'تعذر تحميل ملف XML.',
      error_cert: 'يرجى إعداد شهادة قبل الإرسال عبر TEIF.',
      error_ttn: 'تعذر إرسال هذا المستند إلى TTN.',
      status: {
        not_sent: 'غير مرسل',
        sent: 'مرسل',
        accepted: 'مقبول',
        rejected: 'مرفوض',
      },
      stepper: {
        xml: 'XML',
        sign: 'توقيع',
        ttn: 'TTN',
      },
      modal: {
        preview_title: 'معاينة ملف XML',
        preview_desc: 'راجع المحتوى قبل التصدير أو الإرسال.',
        import_title: 'استيراد ملف XML',
        import_desc: 'أضف ملفًا مطابقًا لمراجعته أو أرشفته.',
      },
      import: {
        drop_zone: 'اسحب ملف XML هنا أو اضغط لاختياره.',
        max_size: 'صيغة XML فقط',
        error: 'تعذر استيراد ملف XML.',
        error_format: 'يرجى اختيار ملف XML صالح.',
        success: 'تم استيراد ملف XML بنجاح.',
      },
      table: {
        ref_client: 'المرجع / العميل',
        compliance: 'الامتثال',
        actions: 'الإجراءات',
        no_docs: 'لا يوجد مستند TEIF حالياً.',
        tooltip_preview: 'معاينة XML',
        tooltip_download: 'تنزيل XML',
      },
      details: {
        net_amount: 'المبلغ الصافي',
        ttn_archive: 'أرشيف TTN',
        algorithm: 'الخوارزمية',
        last_action: 'آخر إجراء',
        action_finalized: 'تمت المراجعة',
      },
      card: {
        config_now: 'إعداد الآن',
      },
      quick_stat: {
        title: 'مستندات معتمدة',
        validated: 'معتمدة',
      },
      footer: {
        title: 'امتثال TEIF تحت السيطرة',
      },
      banner: {
        desc: 'تبقى وظيفة TEIF متاحة بأمان داخل التطبيق حتى لو كانت مخفية من القائمة الرئيسية.',
        button: 'فتح الإعدادات',
        learn_more: 'معرفة المزيد',
      },
    },
  },
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('el_fatoora_lang');
      return (saved === 'fr' || saved === 'en' || saved === 'ar') ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  const setLang = useCallback((newLang) => {
    if (newLang === 'fr' || newLang === 'en' || newLang === 'ar') {
      setLangState(newLang);
      try {
        localStorage.setItem('el_fatoora_lang', newLang);
      } catch {
        console.warn('LocalStorage not available');
      }
    }
  }, []);

  const t = useCallback((key, params = {}) => {
    if (!key) return '';
    
    const getVal = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    const currentList = translations[lang] || translations['fr'] || {};
    const currentOverrides = runtimeOverrides[lang] || {};
    const fallbackOverrides = runtimeOverrides.fr || {};

    const overrideVal = getVal(currentOverrides, key);
    if (overrideVal !== undefined) {
      const interpolate = (input) => {
        if (typeof input !== 'string') return input;
        return input.replace(/\{(\w+)\}/g, (_, token) => params[token] ?? `{${token}}`);
      };
      return interpolate(overrideVal);
    }

    const val = getVal(currentList, key);
    
    const interpolate = (input) => {
      if (typeof input !== 'string') return input;
      return input.replace(/\{(\w+)\}/g, (_, token) => params[token] ?? `{${token}}`);
    };

    if (val !== undefined) return interpolate(val);

    const fallbackOverrideVal = getVal(fallbackOverrides, key);
    if (fallbackOverrideVal !== undefined) return interpolate(fallbackOverrideVal);
    
    const fallbackVal = getVal(translations['fr'], key);
    if (fallbackVal !== undefined) return interpolate(fallbackVal);

    const fallbackLabel = key
      .split('.')
      .pop()
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .trim();

    return fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1);
  }, [lang]);

  const value = {
    lang,
    setLang,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageProvider;

