// ------------------------------------------------------------
// EDIT THIS FILE to add conferences, editions and references.
// Commit the change on GitHub and the site updates in a minute or two.
// ------------------------------------------------------------

const SITE = {
  title: "Conference Library",
  intro: "Readings, films and other works cited at conferences, kept in one place so each year can build on the last."
};

// One entry per conference (a series that meets repeatedly).
// "id" is a short lowercase word used in links and in REFERENCES.
// status of an edition: "past", "current" or "upcoming"
const CONFERENCES = [
  {
    id: "casca",
    name: "CASCA",
    description: "Canadian Astronomical Society / Société Canadienne d'Astronomie (CASCA). Canada’s national professional association uniting astronomers, astrophysicists, engineers, and students in research, outreach, and education.",
    website: "https://www.casca.ca/",
    editions: [ 
      {
        year: 2026,
        status: "current",
        theme: "Emerging Research Showcase",
        dates: "October 28",
        location: "Online",
        website: "https://nyx.physics.mcgill.ca/event/587/",
        bib: "bib/casca.bib",
        notes: "Online edition of CASCA for emerging scientists to present their research."
      }
    ]
  },
];

// One entry per work. Copy a block, paste it below, and edit.
// conference = the conference id above; edition = the year (optional).
// type: "Book", "Article", "Chapter", "Film", "Website", "Other"
const REFERENCES = [];
