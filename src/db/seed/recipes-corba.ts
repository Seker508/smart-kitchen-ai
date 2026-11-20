import type { RecipeSeed } from "./types";

export const corbalar: RecipeSeed[] = [
  {
    t: "Mercimek Çorbası", c: "corba", e: "🥣", p: 10, k: 30, s: 6, z: "KOLAY",
    d: "Kırmızı mercimek, havuç ve patatesle hazırlanan, blenderdan geçirilmiş pürüzsüz lokanta usulü çorba.",
    i: [["kırmızı mercimek", 1.5, "sb", "e"], ["kuru soğan", 1, "adet"], ["havuç", 1, "adet"], ["patates", 1, "adet", "o"], ["un", 1, "yk", "o"], ["tereyağı", 2, "yk"], ["tuz", 1, "tk"], ["kimyon", 1, "ck"], ["pul biber", 1, "ck", "o"], ["limon", 1, "adet", "o", "servis için"], ["su", 7, "sb"]],
    st: ["Mercimeği yıkayıp süzün.", "Tereyağında doğranmış soğanı kavurun, isterseniz unu ekleyip 1 dakika çevirin.", "Mercimek, doğranmış havuç, patates ve sıcak suyu ekleyin.", "Sebzeler ve mercimek dağılana kadar 25-30 dakika pişirin.", "Blenderdan geçirip tuz ve kimyonla tatlandırın; pul biberli tereyağı ve limonla servis edin."],
  },
  {
    t: "Ezogelin Çorbası", c: "corba", e: "🥣", p: 10, k: 35, s: 6, z: "KOLAY",
    d: "Kırmızı mercimek, bulgur ve pirincin salça ve naneyle buluştuğu Gaziantep kökenli çorba.",
    i: [["kırmızı mercimek", 1, "sb", "e"], ["köftelik bulgur", 2, "yk", "e"], ["pirinç", 2, "yk"], ["kuru soğan", 1, "adet"], ["domates salçası", 1, "yk"], ["biber salçası", 1, "tk", "o"], ["tereyağı", 2, "yk"], ["kuru nane", 1, "yk"], ["pul biber", 1, "tk"], ["tuz", 1, "tk"], ["su", 7, "sb"]],
    st: ["Mercimek, bulgur ve pirinci yıkayın.", "Tereyağında soğanı kavurup salçaları ekleyin.", "Bakliyatları ve sıcak suyu ekleyip kaynatın.", "Kısık ateşte 30 dakika, ara ara karıştırarak pişirin.", "Tuzunu ayarlayın; tereyağında nane ve pul biberi kızdırıp üzerine gezdirin."],
  },
  {
    t: "Yayla Çorbası", c: "corba", e: "🥣", p: 10, k: 25, s: 6, z: "ORTA",
    d: "Pirinç ve yoğurdun yumurta ile terbiye edildiği, naneli tereyağıyla servis edilen ferah çorba.",
    i: [["yoğurt", 2, "sb", "e"], ["pirinç", 0.5, "sb", "e"], ["yumurta", 1, "adet"], ["un", 2, "yk"], ["tereyağı", 1, "yk"], ["kuru nane", 1, "yk"], ["tuz", 1, "tk"], ["su", 6, "sb"]],
    st: ["Pirinci 6 su bardağı suda yumuşayana kadar 15 dakika haşlayın.", "Yoğurt, yumurta ve unu bir kasede pürüzsüz olana kadar çırpın.", "Pirinç suyundan birkaç kepçe alıp terbiyeye yavaşça ekleyerek ılıştırın.", "Terbiyeyi sürekli karıştırarak tencereye ekleyin, kaynayınca 5 dakika daha pişirin ve tuzlayın.", "Tereyağında naneyi kızdırıp çorbanın üzerine gezdirin."],
  },
  {
    t: "Domates Çorbası", c: "corba", e: "🍅", p: 10, k: 20, s: 4, z: "KOLAY",
    d: "Taze domatesle hazırlanan, sütle kadifemsi kıvam alan ve kaşarla servis edilen çorba.",
    i: [["domates", 5, "adet", "e"], ["un", 2, "yk"], ["tereyağı", 2, "yk"], ["süt", 1, "sb", "o"], ["domates salçası", 1, "tk", "o"], ["toz şeker", 1, "ck", "o"], ["tuz", 1, "tk"], ["kaşar peyniri", 50, "g", "o", "servis için"], ["su", 4, "sb"]],
    st: ["Tereyağında unu kokusu çıkana kadar kavurun.", "Rendelenmiş domates ve salçayı ekleyip 5 dakika pişirin.", "Sıcak suyu yavaş yavaş, çırparak ekleyin.", "15 dakika kaynatıp blenderdan geçirin.", "Sütü ekleyip bir taşım kaynatın; tuz ve şekerle tatlandırıp rendelenmiş kaşarla servis edin."],
  },
  {
    t: "Tarhana Çorbası", c: "corba", e: "🥣", p: 15, k: 15, s: 4, z: "KOLAY",
    d: "Kurutulmuş tarhananın salça ve tereyağıyla piştiği, kış günlerinin geleneksel ve ekşimsi çorbası.",
    i: [["tarhana", 4, "yk", "e"], ["domates salçası", 1, "yk"], ["tereyağı", 1, "yk"], ["tuz", 1, "ck"], ["kuru nane", 1, "ck", "o"], ["su", 5, "sb"]],
    st: ["Tarhanayı 1 su bardağı soğuk suda 15 dakika bekletin.", "Tereyağında salçayı kavurun.", "Kalan suyu ekleyip kaynatın.", "Tarhanalı karışımı ekleyip sürekli karıştırarak 10-15 dakika pişirin.", "Tuz ve naneyle tatlandırıp servis edin."],
  },
  {
    t: "Şehriye Çorbası", c: "corba", e: "🍜", p: 5, k: 15, s: 4, z: "KOLAY",
    d: "Tel şehriyenin domatesli suyla hızlıca piştiği, çocukların da sevdiği pratik çorba.",
    i: [["tel şehriye", 0.5, "sb", "e"], ["domates", 1, "adet"], ["domates salçası", 1, "tk"], ["sıvı yağ", 2, "yk"], ["tuz", 1, "tk"], ["limon", 0.5, "adet", "o"], ["maydanoz", 0.25, "demet", "o"], ["su", 5, "sb"]],
    st: ["Yağda şehriyeyi hafif kızarana kadar kavurun.", "Rendelenmiş domates ve salçayı ekleyip 2 dakika pişirin.", "Sıcak suyu ekleyip kaynatın.", "Kısık ateşte 10 dakika pişirin, tuzlayın.", "Limon ve maydanozla servis edin."],
  },
  {
    t: "Terbiyeli Tavuk Suyu Çorbası", c: "corba", e: "🍲", p: 15, k: 45, s: 6, z: "ORTA",
    d: "Haşlanmış tavuğun suyuyla hazırlanıp yumurta-limon terbiyesiyle bağlanan şifalı çorba.",
    i: [["tavuk göğsü", 300, "g", "e"], ["tel şehriye", 0.5, "sb", "o"], ["un", 2, "yk"], ["yumurta", 1, "adet"], ["limon", 1, "adet"], ["tereyağı", 1, "yk"], ["tuz", 1, "tk"], ["karabiber", 1, "ck"], ["su", 8, "sb"]],
    st: ["Tavuğu tuzlu suda 30 dakika haşlayıp didikleyin; suyunu saklayın.", "Tavuk suyuna şehriyeyi ekleyip 8 dakika pişirin.", "Un, yumurta ve limon suyunu biraz soğuk suyla çırpıp terbiye hazırlayın.", "Terbiyeyi sıcak çorbadan birkaç kepçe ekleyerek ılıştırıp tencereye katın.", "Tavukları ve tereyağını ekleyip bir taşım kaynatın; karabiberle servis edin."],
  },
  {
    t: "Mantar Çorbası", c: "corba", e: "🍄", p: 10, k: 20, s: 4, z: "KOLAY",
    d: "Kültür mantarının tereyağında sotelenip sütle bağlandığı kremamsı çorba.",
    i: [["kültür mantarı", 300, "g", "e"], ["kuru soğan", 1, "adet", "o"], ["un", 2, "yk"], ["tereyağı", 2, "yk"], ["süt", 2, "sb"], ["tuz", 1, "tk"], ["karabiber", 1, "ck"], ["su", 3, "sb"]],
    st: ["Mantarları küçük doğrayın.", "Tereyağında soğan ve mantarları suyunu çekene kadar soteleyin.", "Unu ekleyip 1-2 dakika kavurun.", "Sıcak suyu çırparak ekleyin, 10 dakika pişirin.", "Sütü ekleyip kaynatın; tuz ve karabiberle tatlandırın."],
  },
  {
    t: "Sebze Çorbası", c: "corba", e: "🥕", p: 15, k: 25, s: 6, z: "KOLAY",
    d: "Havuç, patates, kabak ve bezelyeyle hazırlanan, buzdolabındaki sebzeleri değerlendiren besleyici çorba.",
    i: [["havuç", 1, "adet", "e"], ["patates", 2, "adet", "e"], ["kabak", 1, "adet"], ["bezelye", 0.5, "sb", "o"], ["kuru soğan", 1, "adet"], ["domates salçası", 1, "tk", "o"], ["un", 1, "yk", "o"], ["zeytinyağı", 2, "yk"], ["tuz", 1, "tk"], ["su", 6, "sb"]],
    st: ["Sebzeleri küçük küp doğrayın.", "Zeytinyağında soğanı kavurun, isterseniz salça ve unu ekleyin.", "Havuç ve patatesleri ekleyip birkaç dakika çevirin.", "Kabak, bezelye ve sıcak suyu ekleyin.", "Sebzeler yumuşayana kadar 20-25 dakika pişirin; dilerseniz blenderdan geçirin."],
  },
  {
    t: "Brokoli Çorbası", c: "corba", e: "🥦", p: 10, k: 20, s: 4, z: "KOLAY",
    d: "Brokoli ve patatesin sütle pürüzsüz bir kıvama getirildiği yeşil ve hafif çorba.",
    i: [["brokoli", 1, "adet", "e"], ["patates", 1, "adet"], ["kuru soğan", 1, "adet", "o"], ["tereyağı", 1, "yk"], ["süt", 1, "sb"], ["tuz", 1, "tk"], ["karabiber", 1, "ck"], ["su", 4, "sb"]],
    st: ["Brokoliyi küçük çiçeklere ayırın, patatesi küp doğrayın.", "Tereyağında soğanı kavurun.", "Brokoli, patates ve sıcak suyu ekleyip 15 dakika pişirin.", "Blenderdan geçirin.", "Sütü ekleyip bir taşım kaynatın, tuz ve karabiberle tatlandırın."],
  },
  {
    t: "Patates Çorbası", c: "corba", e: "🥔", p: 10, k: 25, s: 4, z: "KOLAY",
    d: "Patates ve havucun tereyağıyla piştiği, kıtır ekmekle servis edilen kadifemsi çorba.",
    i: [["patates", 4, "adet", "e"], ["havuç", 1, "adet", "o"], ["kuru soğan", 1, "adet"], ["tereyağı", 2, "yk"], ["süt", 1, "sb", "o"], ["tuz", 1, "tk"], ["karabiber", 1, "ck"], ["su", 5, "sb"]],
    st: ["Patates, havuç ve soğanı doğrayın.", "Tereyağında soğanı kavurun, sebzeleri ekleyin.", "Sıcak suyu ekleyip patatesler dağılana kadar 20 dakika pişirin.", "Blenderdan geçirip isterseniz süt ekleyin.", "Tuz ve karabiberle tatlandırın."],
  },
  {
    t: "Düğün Çorbası", c: "corba", e: "🍲", p: 15, k: 90, s: 6, z: "ZOR",
    d: "Haşlanmış etin suyuyla hazırlanıp yumurta-yoğurt terbiyesiyle bağlanan, pul biberli tereyağıyla servis edilen geleneksel çorba.",
    i: [["kuşbaşı et", 300, "g", "e"], ["yoğurt", 1, "sb"], ["yumurta", 1, "adet"], ["un", 2, "yk"], ["limon", 0.5, "adet"], ["tereyağı", 1, "yk"], ["pul biber", 1, "tk"], ["tuz", 1, "tk"], ["su", 8, "sb"]],
    st: ["Eti tuzlu suda 70-80 dakika yumuşayana kadar haşlayın, didikleyin.", "Yoğurt, yumurta, un ve limon suyunu çırpın.", "Terbiyeyi sıcak et suyuyla ılıştırıp tencereye ekleyin.", "Eti ilave edip sürekli karıştırarak 10 dakika pişirin.", "Tereyağında pul biberi kızdırıp üzerine gezdirin."],
  },
  {
    t: "Balkabağı Çorbası", c: "corba", e: "🎃", p: 15, k: 25, s: 4, z: "KOLAY",
    d: "Balkabağının havuç ve zencefille pişip krema ile yumuşatıldığı sonbahar çorbası.",
    i: [["balkabağı", 600, "g", "e"], ["havuç", 1, "adet"], ["kuru soğan", 1, "adet"], ["zeytinyağı", 2, "yk"], ["krema", 100, "ml", "o"], ["zencefil", 1, "ck", "o", "toz"], ["tuz", 1, "tk"], ["su", 4, "sb"]],
    st: ["Balkabağını soyup küp doğrayın.", "Zeytinyağında soğan ve havucu kavurun.", "Balkabağı, zencefil ve sıcak suyu ekleyip 20 dakika pişirin.", "Blenderdan geçirin.", "Krema ve tuzu ekleyip bir taşım kaynatın."],
  },
  {
    t: "Yeşil Mercimek Çorbası", c: "corba", e: "🥣", p: 10, k: 40, s: 6, z: "KOLAY",
    d: "Yeşil mercimek ve erişteyle pişen, ekşimsi ve doyurucu köy usulü çorba.",
    i: [["yeşil mercimek", 1, "sb", "e"], ["erişte", 0.5, "sb", "o"], ["kuru soğan", 1, "adet"], ["domates salçası", 1, "yk"], ["sıvı yağ", 2, "yk"], ["kuru nane", 1, "tk"], ["pul biber", 1, "ck"], ["tuz", 1, "tk"], ["su", 7, "sb"]],
    st: ["Mercimeği yıkayıp 25 dakika haşlayın.", "Ayrı tavada yağda soğanı kavurup salçayı ekleyin.", "Kavrulan karışımı mercimeğe ekleyin.", "Erişteyi ekleyip 10 dakika daha pişirin.", "Nane, pul biber ve tuzla tatlandırın."],
  },
];
