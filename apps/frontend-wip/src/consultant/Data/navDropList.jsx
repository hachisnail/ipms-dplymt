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
        badge: 'ID'
      },
      {
        _id: '1-2',
        name: 'Under Review of Utility Model',
        icon: 'bi bi-lightbulb',
        href: 'main2/UnderReviewum',
        badge: 'UM'
      },
      {
        _id: '1-3',
        name: 'Under Review of Copyright',
        icon: 'bi bi-shield-check',
        href: 'main2/UnderReviewcr',
        badge: 'CR'
      },
      {
        _id: '1-4',
        name: 'Under Review of Trademark',
        icon: 'bi bi-award',
        href: 'main2/UnderReviewtm',
        badge: 'TM'
      }
    ]
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
        badge: 'ID'
      },
      {
        _id: '2-2',
        name: 'Approved Utility Model',
        icon: 'bi bi-lightbulb',
        href: 'main2/Approvedum',
        badge: 'UM'
      },
      {
        _id: '2-3',
        name: 'Approved Copyright',
        icon: 'bi bi-shield-check',
        href: 'main2/Approvedcr',
        badge: 'CR'
      },
      {
        _id: '2-4',
        name: 'Approved Trademark',
        icon: 'bi bi-award',
        href: 'main2/Approvedtm',
        badge: 'TM'
      }
    ]
  },
  {
    _id: 3,
    name: 'Rejected Application',
    icon: 'bi bi-folder-x',
    color: '#2563eb',
    description: 'Application Rejection Table',
    children: [
      {
        _id: '3-1',
        name: 'Rejected Industrial Design',
        icon: 'bi bi-pencil-square',
        href: 'main2/Rejectedid',
        badge: 'ID'
      },
      {
        _id: '3-2',
        name: 'Rejected Utility Model',
        icon: 'bi bi-lightbulb',
        href: 'main2/Rejectedum',
        badge: 'UM'
      },
      {
        _id: '3-3',
        name: 'Rejected Copyright',
        icon: 'bi bi-shield-check',
        href: 'main2/Rejectedcr',
        badge: 'CR'
      },
      {
        _id: '3-4',
        name: 'Rejected Trademark',
        icon: 'bi bi-award',
        href: 'main2/Rejectedtm',
        badge: 'TM'
      }
    ]
  },
];

export default navDropList;
