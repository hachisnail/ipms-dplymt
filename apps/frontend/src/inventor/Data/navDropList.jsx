// navDropList.jsx
// Supports optional `badge` count per item/child — fed from notification counts

const navDropList = [
  {
    _id: 1,
    name: 'Submission Portal',
    icon: 'bi bi-layout-text-window-reverse',
    // badge: pass a number here to show a count on the parent item
    // e.g.  badge: 3  →  shows "3" on the Submission Portal row
    children: [
      { _id: '3-1', name: 'UMID Portal',      icon: 'bi bi-circle', href: '#UMIDPortal'      },
      { _id: '3-2', name: 'Trademark Portal', icon: 'bi bi-circle', href: '#TrademarkPortal' },
      { _id: '3-3', name: 'Copyright Portal', icon: 'bi bi-circle', href: '#CopyrightPortal' },
    ],
  },
];

export default navDropList;