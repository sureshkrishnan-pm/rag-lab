export interface CorpusDoc {
  id: string;
  title: string;
  text: string;
}

// Small original corpus (space exploration theme). Written from scratch for
// this project, not copied from any source, so licensing is trivially clear
// (see SOURCES.md).
export const CORPUS: CorpusDoc[] = [
  {
    id: "apollo",
    title: "The Apollo Program",
    text: "The Apollo program was NASA's effort to land humans on the Moon and bring them home safely. It ran from 1961 to 1972 and included six crewed Moon landings. Apollo 11 made the first landing in July 1969, when Neil Armstrong and Buzz Aldrin walked on the lunar surface while Michael Collins orbited above in the command module. The missions used the Saturn V rocket, the most powerful launch vehicle flown at the time. Later missions, such as Apollo 15 through 17, carried a lunar rover and stayed on the surface for several days, collecting hundreds of kilograms of Moon rocks for study on Earth.",
  },
  {
    id: "iss",
    title: "The International Space Station",
    text: "The International Space Station, or ISS, is a large research laboratory orbiting Earth at an altitude of roughly 400 kilometers. It has been continuously occupied by rotating crews since November 2000, making it the longest continuously inhabited structure in space. The station is a joint project of NASA, Roscosmos, ESA, JAXA, and the Canadian Space Agency, with modules contributed by each partner. Astronauts aboard the ISS conduct experiments in microgravity, covering fields such as biology, materials science, and human physiology, to prepare for longer missions to the Moon and Mars. The station completes an orbit of Earth about every ninety minutes.",
  },
  {
    id: "voyager",
    title: "Voyager 1 and 2",
    text: "Voyager 1 and Voyager 2 are twin NASA probes launched in 1977 to study the outer planets. Voyager 2 flew past Jupiter, Saturn, Uranus, and Neptune, remaining the only spacecraft to have visited the latter two. Voyager 1 crossed into interstellar space in 2012, becoming the first human-made object to leave the heliosphere. Both spacecraft carry a golden record containing sounds and images meant to represent life on Earth. They are powered by radioisotope thermoelectric generators, which convert heat from decaying plutonium into electricity, allowing the probes to keep transmitting data more than four decades after launch.",
  },
  {
    id: "rovers",
    title: "Mars Rovers",
    text: "NASA has landed a series of increasingly capable rovers on Mars, starting with the small Sojourner in 1997, followed by Spirit and Opportunity in 2004, Curiosity in 2012, and Perseverance in 2021. Each rover studies the Martian surface for clues about the planet's climate history and searches for signs that microbial life could once have existed. Perseverance carried a small helicopter named Ingenuity, which became the first aircraft to achieve powered, controlled flight on another planet. Curiosity and Perseverance are powered by radioisotope generators, while the earlier rovers relied on solar panels, which limited how long they could operate through Martian dust storms.",
  },
  {
    id: "hubble",
    title: "The Hubble Space Telescope",
    text: "The Hubble Space Telescope was launched in 1990 aboard the Space Shuttle Discovery and has operated for over three decades. By orbiting above Earth's atmosphere, Hubble avoids the blurring effects that ground-based telescopes must correct for, letting it capture extremely sharp images in visible, ultraviolet, and near-infrared light. It is famous for the Hubble Deep Field images, which revealed thousands of previously unseen galaxies in a tiny patch of sky. Because it was designed for servicing, astronauts visited Hubble five times aboard the Space Shuttle to repair instruments and upgrade its cameras, extending its working life far beyond original plans.",
  },
  {
    id: "jwst",
    title: "The James Webb Space Telescope",
    text: "The James Webb Space Telescope, or JWST, launched in December 2021 and is the largest space telescope ever built. Unlike Hubble, Webb observes primarily in infrared light, which lets it see through dust clouds and detect the faint, redshifted light of very distant, early galaxies. It orbits near the second Lagrange point, about 1.5 million kilometers from Earth, where its large gold-coated beryllium mirror segments stay shielded from sunlight by a tennis-court-sized sunshield. Webb has been used to study the atmospheres of exoplanets by analyzing starlight that passes through them, searching for chemical signatures that could hint at habitability.",
  },
  {
    id: "spacex",
    title: "Reusable Rockets and SpaceX",
    text: "SpaceX has changed spaceflight economics by developing rockets that can land and fly again. Since 2015, Falcon 9 first-stage boosters have routinely landed on drone ships or landing pads after launch, and many boosters have flown more than a dozen missions. The company's Crew Dragon capsule has carried NASA astronauts to the International Space Station since 2020, restoring the United States' ability to launch its own crews after the Space Shuttle's retirement. SpaceX is now developing Starship, a fully reusable two-stage vehicle intended to carry large crews and cargo, with an eventual goal of supporting missions to Mars.",
  },
  {
    id: "gps",
    title: "Satellite Navigation Systems",
    text: "Global positioning relies on constellations of satellites orbiting Earth, with the United States' GPS system using around thirty satellites in medium Earth orbit. A receiver on the ground calculates its position by measuring how long radio signals take to arrive from at least four satellites and using those travel times to triangulate a location, a process called trilateration. Other countries operate their own systems, including Russia's GLONASS, the European Union's Galileo, and China's BeiDou, and modern receivers can often combine signals from several constellations to improve accuracy. These systems also provide precise timing signals used by financial networks and power grids.",
  },
  {
    id: "exoplanets",
    title: "Discovering Exoplanets",
    text: "An exoplanet is a planet that orbits a star other than the Sun. The first confirmed exoplanet around a Sun-like star, 51 Pegasi b, was discovered in 1995, and thousands more have been found since. The transit method, used heavily by the Kepler and TESS space telescopes, detects the slight dimming of a star's light as a planet passes in front of it. The radial velocity method instead measures the small wobble a planet's gravity induces in its star. Astronomers pay particular attention to planets found in the habitable zone, the range of distances from a star where liquid water could exist on a rocky surface.",
  },
  {
    id: "spaceweather",
    title: "Space Weather and Solar Activity",
    text: "Space weather describes how activity on the Sun affects the environment around Earth. Solar flares release bursts of radiation, while coronal mass ejections send large clouds of charged particles outward into the solar system. When these particles reach Earth, they can compress and disturb the planet's magnetosphere, causing geomagnetic storms. Strong storms can induce currents in power grids, disrupt radio communication, degrade GPS accuracy, and increase radiation exposure for astronauts and airline passengers on polar routes. The same interaction between solar particles and the magnetosphere also produces the aurora borealis and aurora australis, visible at high latitudes.",
  },
];
