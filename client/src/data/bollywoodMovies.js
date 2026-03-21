/**
 * Curated list of 365+ Bollywood movies for Daily Challenge.
 */
export const BOLLYWOOD_MOVIES = [
  'Sholay','Deewar','Zanjeer','Don','Mughal-E-Azam','Mother India',
  'Pyaasa','Kaagaz Ke Phool','Guide','Anand','Aradhana',
  'Dilwale Dulhania Le Jayenge','Hum Aapke Hain Koun','Maine Pyar Kiya',
  'Qayamat Se Qayamat Tak','Tezaab','Ram Lakhan','Chandni',
  'Jo Jeeta Wohi Sikandar','Roja','Bombay','Rangeela','Darr',
  'Baazigar','Anjaam','Mohra','Dil','Saajan','Trishul','Parinda',
  'Lagaan','Dil Chahta Hai','Devdas','Kaante','Company',
  'Kal Ho Na Ho','Chalte Chalte','Koi Mil Gaya','Dhoom',
  'Veer-Zaara','Black','Bunty Aur Babli','Sarkar',
  'Salaam Namaste','Rang De Basanti','Fanaa','Omkara',
  'Lage Raho Munna Bhai','Krrish','Chak De India','Om Shanti Om',
  'Taare Zameen Par','Jodhaa Akbar','Rock On','Ghajini',
  'Rab Ne Bana Di Jodi','Dev D','3 Idiots','My Name Is Khan',
  'Dabangg','Once Upon A Time In Mumbaai','No One Killed Jessica',
  'Zindagi Na Milegi Dobara','Bodyguard','Don 2','Agneepath',
  'Kahaani','Vicky Donor','Barfi','Gangs Of Wasseypur',
  'Ek Tha Tiger','Jab Tak Hai Jaan','Bhaag Milkha Bhaag',
  'Raanjhanaa','Lootera','Ram-Leela','Queen','Jai Ho',
  'PK','Haider','Mary Kom','Highway','Kick','Bang Bang',
  'Bajrangi Bhaijaan','Dil Dhadakne Do','Tanu Weds Manu Returns',
  'Bajirao Mastani','Dilwale','Rustom','Dangal','Sultan','Fan',
  'Ae Dil Hai Mushkil','Raees','Kaabil','Hindi Medium',
  'Padmaavat','Raazi','Sanju','Stree','Andhadhun','Badhaai Ho',
  'URI: The Surgical Strike','Gully Boy','Article 15',
  'Chhichhore','Mission Mangal','Bala','Tanhaji: The Unsung Warrior',
  'Thappad','Shershaah','Sooryavanshi','Atrangi Re',
  'The Kashmir Files','Gangubai Kathiawadi','Runway 34',
  'Brahmastra Part One: Shiva','Drishyam 2','Pathaan',
  'Tu Jhoothi Main Makkaar','Adipurush',
  'Rocky Aur Rani Kii Prem Kahaani','Gadar 2','Jawan',
  'Tiger 3','Animal','Sam Bahadur','Dunki','Fighter',
  'Stree 2','Pushpa 2: The Rule','Dhurandhar','Sky Force',
  'Kapoor And Sons','Newton','Masaan','Neerja','Udta Punjab',
  'Bareilly Ki Barfi','Dum Laga Ke Haisha','Trapped',
  'Dobaaraa','Darlings','Gehraiyaan','Thar','Jalsa',
  'KGF Chapter 1','KGF Chapter 2','Baahubali: The Beginning',
  'Baahubali: The Conclusion','Master','Vikram',
  'Ponniyin Selvan: I','Ponniyin Selvan: II','Jailer','Leo',
  'Kabhi Khushi Kabhie Gham','Mohabbatein','Kuch Kuch Hota Hai',
  'Hum Tum','Jab We Met','Aashiqui 2','Ek Villain',
  'Luka Chuppi','Shiddat','Haseen Dillruba',
  'Golmaal: Fun Unlimited','Golmaal Returns','Golmaal Again',
  'Hera Pheri','Phir Hera Pheri','Welcome','Dhamaal',
  'Bhool Bhulaiyaa','Bhool Bhulaiyaa 2','Bhool Bhulaiyaa 3',
  'Oh My God','Jolly LLB','Fukrey','Fukrey Returns',
  'War','Kabir Singh','Baaghi','Baaghi 2','Baaghi 3',
  'Tiger Zinda Hai','Simmba',
  'MS Dhoni: The Untold Story','Paan Singh Tomar','Airlift',
  'Gold','Padman','Manikarnika: The Queen Of Jhansi',
  'Samrat Prithviraj','Panipat',
  'Golmaal 3','Double Dhamaal','Total Dhamaal',
  'Housefull','Housefull 2','Housefull 3','Housefull 4',
  'Coolie No 1','Judwaa 2','De De Pyaar De',
  'Half Girlfriend','Pyaar Ka Punchnama',
  'Sachin: A Billion Dreams','Azhar','Sarabjit',
  'Fukrey Returns','Judwaa','Coolie No 1',
  'Sardar Udham','Bell Bottom','Bhuj: The Pride Of India',
  'Jersey','Attack','Heropanti 2','Prithviraj',
  'Jug Jugg Jeeyo','Shamshera','Vikram Vedha','Ram Setu',
  'An Action Hero','Kisi Ka Bhai Kisi Ki Jaan',
  'Dream Girl 2','OMG 2','Maidaan',
  'Bade Miyan Chote Miyan','Mr And Mrs Mahi','Singham Returns',
  'War 2','Devara','Yodha',
  'Wazir','Phobia','Neerja','Aligarh','Masaan',
  'Lipstick Under My Burkha','Udaan','Mukkabaaz',
  'Looop Lapeta','AK vs AK','Gulabo Sitabo',
  'Dil Bechara','Shakuntala Devi','Gunjan Saxena: The Kargil Girl',
  'Ludo','Scam 1992','Delhi Crime',
];

export function getDailyMovie() {
  const epoch = new Date('2024-01-01T00:00:00Z');
  const today = new Date();
  today.setHours(0,0,0,0);
  const dayN = Math.floor((today - epoch) / 86400000);
  return BOLLYWOOD_MOVIES[((dayN % BOLLYWOOD_MOVIES.length) + BOLLYWOOD_MOVIES.length) % BOLLYWOOD_MOVIES.length];
}

export function getDayNumber() {
  const epoch = new Date('2024-01-01T00:00:00Z');
  const today = new Date();
  today.setHours(0,0,0,0);
  return Math.floor((today - epoch) / 86400000) + 1;
}

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
