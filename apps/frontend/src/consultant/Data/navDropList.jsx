// navDropList.jsx — Consultant
// Static `badge` text strings (e.g. 'ID', 'UM', 'CR', 'TM') removed from all
// children. Dynamic number badges are injected at render time by
// ConsultantSideBar.jsx via the `notifBadge` prop.

const navDropList = [
  {
    _id: 1,
    name: 'Under Review',
    icon: 'bi bi-hourglass-split',
    description: 'Submissions pending review',
    children: [
      {
        _id: '1-1',
        name: 'Under Review of Industrial Design',
        icon: 'bi bi-pencil-square',
        href: 'main2/UnderReviewid',
      },
      {
        _id: '1-2',
        name: 'Under Review of Utility Model',
        icon: 'bi bi-lightbulb',
        href: 'main2/UnderReviewum',
      },
      {
        _id: '1-3',
        name: 'Under Review of Copyright',
        icon: 'bi bi-shield-check',
        href: 'main2/UnderReviewcr',
      },
      {
        _id: '1-4',
        name: 'Under Review of Trademark',
        icon: 'bi bi-award',
        href: 'main2/UnderReviewtm',
      },
    ],
  },

  {
    _id: 2,
    name: 'Approved for Filing',
    icon: 'bi bi-check-circle',
    color: '#16a34a',
    description: 'Ready to file with IP office',
    children: [
      {
        _id: '2-1',
        name: 'Approved Industrial Design',
        icon: 'bi bi-pencil-square',
        href: 'main2/Approvedid',
      },
      {
        _id: '2-2',
        name: 'Approved Utility Model',
        icon: 'bi bi-lightbulb',
        href: 'main2/Approvedum',
      },
      {
        _id: '2-3',
        name: 'Approved Copyright',
        icon: 'bi bi-shield-check',
        href: 'main2/Approvedcr',
      },
      {
        _id: '2-4',
        name: 'Approved Trademark',
        icon: 'bi bi-award',
        href: 'main2/Approvedtm',
      },
    ],
  },
];

export default navDropList;