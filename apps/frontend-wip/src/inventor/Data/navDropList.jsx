const navDropList = [
  {
    _id: 2,
    name: 'Examination Guides',
    icon: 'bi bi-book',
    children: [
     {_id: '2-1', name: 'Utility Model Examination Guide', icon: 'bi bi-circle', href: '#UtilityModelExaminationGuide'},
     {_id: '2-2', name: 'Industrial Design Examination Guide', icon: 'bi bi-circle', href: '#IndustrialDesignExaminationGuide'},
     {_id: '2-3', name: 'Trademark Examination Guide', icon: 'bi bi-circle', href: '#TrademarkExaminationGuide'},
     {_id: '2-4', name: 'Copyright Examination Guide', icon: 'bi bi-circle', href: '#CopyrightExaminationGuide'},
    ],
  },
  {
    _id: 3,
    name: ' Application Forms',
    icon: 'bi bi-file-earmark',
    children: [
      {
        _id: '3-1',
        name: 'IP02 Utility Model',
        icon: 'bi bi-folder',
        children: [
          { _id: '3-1-1', name: 'Registration Request', icon: 'bi bi-circle', href: "/pdfs/IP02 - Utility Model/IPOPHLFillableForm200.pdf" },
          { _id: '3-1-2', name: 'Assignment Application', icon: 'bi bi-circle', href: "/pdfs/IP02 - Utility Model/Assignment-of-Application-for-Letters-Patent-UM-ID-Form-PENDING.pdf" },
          { _id: '3-1-3', name: 'Waiver of Confidentiality', icon: 'bi bi-circle', href: "/pdfs/IP02 - Utility Model/Waiver-of-Confidentiality-017.pdf" },
          { _id: '3-1-4', name: 'Petition of Cancellation', icon: 'bi bi-circle', href: "/pdfs/IP02 - Utility Model/Petition-for-Cancellation-018.pdf"},
          { _id: '3-1-5', name: 'Green Tech Incentive Program Reqst', icon: 'bi bi-circle', href: "/pdfs/IP02 - Utility Model/Request Form - Green Technology Incentive Program_FillableForm.pdf" },
        ],
      },
      {
        _id: '3-2',
        name: 'IP03 Industrial Design',
        icon: 'bi bi-folder',
        children: [
          { _id: '3-2-1', name: 'Industrial Design Reg.reqst', icon: 'bi bi-circle', href: "/pdfs/IP03 - Industrial Design/IPOPHLFillableForm300.pdf" },
          { _id: '3-2-2', name: 'Petition of Cancellation', icon: 'bi bi-circle', href: "/pdfs/IP03 - Industrial Design/Petition for Cancellation-018.pdf" },
          { _id: '3-2-3', name: 'Green Tech Incentive Program Reqst', icon: 'bi bi-circle', href: "/pdfs/IP03 - Industrial Design/Request Form - Green Technology Incentive Program_FillableForm.pdf" },
        ],
      },
      {
        _id: '3-3',
        name: 'IP04 Trademark',
        icon: 'bi bi-folder',
        children: [
          { _id: '3-3-1', name: 'Assignment of Application', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Assignment_of_Application.pdf" },
          { _id: '3-3-2', name: 'Assignement Registered Trademark', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Assignment_of_Registered_Trademark.pdf" },
          { _id: '3-3-3', name: 'Declaration  of Actual Use', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Declaration_of_Actual_Use.pdf" },
          { _id: '3-3-4', name: 'Trademark Application', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/IPOPHLFillableForm400.pdf" },
          { _id: '3-3-5', name: 'Reqst for Priotrity Claims', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Request for priority exam.pdf" },
          { _id: '3-3-6', name: 'Reqst for Revival in Exam', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Request for Revival in Examination.pdf" },
          { _id: '3-3-7', name: 'Reqst for Suspension of Action', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Request for Suspension of Action.pdf"},
          { _id: '3-3-8', name: 'Revival in Publication', icon: 'bi bi-circle', href: "/pdfs/IP04 - Trademark/Revival_in_Publication.pdf"},
        ]
      },
      {
        _id: '3-4',
        name: 'IP05 Copyright',
        icon: 'bi bi-folder',
        children: [
          { _id: '3-4-1', name: 'Copyright Registration & Deposit', icon: 'bi bi-circle', href: "/pdfs/IP05 - Copyright/Copyright Deposit Form.pdf" },
          { _id: '3-4-2', name: 'Copyright Registration Reqst', icon: 'bi bi-circle', href: "/pdfs/IP05 - Copyright/NLP - CopyrightRegReq.pdf" },
          { _id: '3-4-3', name: 'NLP-Registration ', icon: 'bi bi-circle', href: "/pdfs/IP05 - Copyright/NLP-034 APPLICATION FOR COPYRIGHT REGISTRATION.pdf" },
          // ✅ FIXED: Removed leading space in path
          { _id: '3-4-4', name: 'Copyright Services Reqst Form', icon: 'bi bi-circle', href: "/pdfs/IP05 - Copyright/NLP-034 APPLICATION FOR COPYRIGHT REGISTRATION.pdf" },
        ],
      },
    ],
  },
  {
     _id: 4,
    name: 'Submission Portal',
    icon: 'bi bi-layout-text-window-reverse',
    children: [
      { _id: '4-1', name: 'Utility Model Portal', icon: 'bi bi-circle', href: '#UtilityModelPortal' },
      { _id: '4-2', name: 'Industrial Design Portal', icon: 'bi bi-circle', href: '#IndustrialDesignPortal' },
      { _id: '4-3', name: 'Trademark Portal', icon: 'bi bi-circle', href: '#TrademarkPortal' },
      { _id: '4-4', name: 'Copyright Portal', icon: 'bi bi-circle', href: '#CopyrightPortal' },
    ],
  },
];

export default navDropList;