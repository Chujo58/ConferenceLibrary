// ------------------------------------------------------------
// EDIT THIS FILE to add conferences, editions and references.
// Commit the change on GitHub and the site updates in a minute or two.
// ------------------------------------------------------------

const SITE = {
  title: "Conference Library",
  intro: "Readings, films and other works cited at our conferences, kept in one place so each year can build on the last."
};

// One entry per conference (a series that meets repeatedly).
// "id" is a short lowercase word used in links and in REFERENCES.
// status of an edition: "past", "current" or "upcoming"
const CONFERENCES = [
  {
    id: "casca",
    name: "CASCA",
    description: "Replace with a one or two sentence description of this conference.",
    website: "",
    editions: [
      {
        year: 2027,
        status: "upcoming",
        theme: "Theme to be announced",
        dates: "Dates to be announced",
        location: "Location to be announced",
        website: "",
        notes: "Add the call for papers, deadlines or organizer contacts here."
      },
      {
        year: 2026,
        status: "current",
        theme: "Replace with this year's theme",
        dates: "Replace with dates",
        location: "Replace with city and venue",
        website: "",
        notes: "Add a short description of this edition here."
      }
    ]
  },
  {
    id: "second-conference",
    name: "Second Conference",
    description: "Placeholder showing a second conference. Edit or delete this block.",
    website: "",
    editions: [
      {
        year: 2026,
        status: "current",
        theme: "Replace with theme",
        dates: "Replace with dates",
        location: "Replace with location",
        website: "",
        notes: ""
      }
    ]
  }
];

// One entry per work. Copy a block, paste it below, and edit.
// conference = the conference id above; edition = the year (optional).
// type: "Book", "Article", "Chapter", "Film", "Website", "Other"
const REFERENCES = [
  {
    title: "Example: The Gift",
    authors: "Marcel Mauss",
    year: 1925,
    type: "Book",
    conference: "casca",
    edition: 2026,
    tags: ["exchange", "classic"],
    url: "",
    note: "Placeholder entry. Delete or replace it."
  },
  {
    title: "Example: Writing Culture",
    authors: "James Clifford and George E. Marcus (eds.)",
    year: 1986,
    type: "Book",
    conference: "second-conference",
    edition: 2026,
    tags: ["ethnography", "methods"],
    url: "",
    note: "Placeholder entry. Delete or replace it."
  }
];
