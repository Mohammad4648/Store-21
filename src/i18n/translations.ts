import { Language } from '../types/commerce';

export const UI_COPY: Record<
  Language,
  {
    brand: string;
    nav: {
      home: string;
      chats: string;
      channels: string;
      profile: string;
      searchPlaceholder: string;
      cart: string;
    };
    common: {
      follow: string;
      following: string;
      verified: string;
      inStock: string;
      outOfStock: string;
      addToCart: string;
      orderNow: string;
      viewDetails: string;
      contactSeller: string;
      inspect3D: string;
      save: string;
      cancel: string;
      close: string;
      send: string;
      viewAll: string;
      comments: string;
      live: string;
      replay: string;
      edit: string;
      delete: string;
      search: string;
      connect: string;
      disconnect: string;
      syncNow: string;
    };
  }
> = {
  ar: {
    brand: 'Store-21',
    nav: {
      home: 'الرئيسية',
      chats: 'المحادثات',
      channels: 'القنوات',
      profile: 'حسابي',
      searchPlaceholder: 'ابحث عن قنوات أو منتجات أو محادثات...',
      cart: 'السلة',
    },
    common: {
      follow: 'متابعة',
      following: 'متابَع',
      verified: 'موثق',
      inStock: 'متوفر',
      outOfStock: 'نفدت الكمية',
      addToCart: 'إضافة إلى السلة',
      orderNow: 'طلب المنتج',
      viewDetails: 'عرض التفاصيل',
      contactSeller: 'تواصل مع البائع',
      inspect3D: 'عرض ثلاثي الأبعاد',
      save: 'حفظ',
      cancel: 'إلغاء',
      close: 'إغلاق',
      send: 'إرسال',
      viewAll: 'عرض الكل',
      comments: 'تعليق',
      live: 'مباشر',
      replay: 'إعادة البث',
      edit: 'تعديل',
      delete: 'حذف',
      search: 'بحث',
      connect: 'ربط',
      disconnect: 'فصل',
      syncNow: 'مزامنة الآن',
    },
  },
  en: {
    brand: 'Store-21',
    nav: {
      home: 'Home',
      chats: 'Chats',
      channels: 'Channels',
      profile: 'Profile',
      searchPlaceholder: 'Search channels, products, or chats...',
      cart: 'Cart',
    },
    common: {
      follow: 'Follow',
      following: 'Following',
      verified: 'Verified',
      inStock: 'In stock',
      outOfStock: 'Out of stock',
      addToCart: 'Add to Cart',
      orderNow: 'Order Now',
      viewDetails: 'View Details',
      contactSeller: 'Contact Seller',
      inspect3D: '3D View',
      save: 'Save',
      cancel: 'Cancel',
      close: 'Close',
      send: 'Send',
      viewAll: 'View all',
      comments: 'comments',
      live: 'LIVE',
      replay: 'Replay',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      connect: 'Connect',
      disconnect: 'Disconnect',
      syncNow: 'Sync Now',
    },
  },
};
