import type { RecipeSeed } from "./types";

export const kahvaltiliklar: RecipeSeed[] = [
  {
    t: "Menemen", c: "kahvaltilik", e: "🍳", p: 5, k: 15, s: 2, z: "KOLAY",
    d: "Domates ve biberin tavada yumurtayla buluştuğu, Türk kahvaltısının yıldızı.",
    i: [["yumurta", 4, "adet", "e"], ["domates", 3, "adet", "e"], ["sivri biber", 3, "adet"], ["kuru soğan", 1, "adet"], ["tuz", 1, "ck"], ["tereyağı", 1, "yk", "o"], ["pul biber", 1, "ck", "o"]],
    st: ["Biberleri ve soğanı doğrayıp tereyağında yumuşatın.", "Domatesleri rendeleyip ya da küçük doğrayıp ekleyin, suyunu çekene kadar pişirin.", "Tuzu ekleyin.", "Yumurtaları kırıp dilediğiniz kıvama kadar karıştırarak pişirin.", "Pul biber serperek sıcak servis edin."],
  },
  {
    t: "Pankek", c: "kahvaltilik", e: "🥞", p: 10, k: 15, s: 4, z: "KOLAY",
    d: "Kabarık ve yumuşak, bal ya da meyveyle servis edilen kahvaltı klasiği.",
    i: [["un", 1.5, "sb", "e"], ["süt", 1, "sb", "e"], ["yumurta", 2, "adet", "e"], ["toz şeker", 2, "yk"], ["kabartma tozu", 0.5, "pk"], ["sıvı yağ", 2, "yk"], ["tuz", 1, "tutam"], ["bal", 3, "yk", "o", "servis için"]],
    st: ["Yumurta, süt, şeker ve yağı çırpın.", "Un, kabartma tozu ve tuzu ekleyip pürüzsüz bir hamur elde edin.", "Hamuru 5 dakika dinlendirin.", "Yapışmaz tavayı ısıtıp kepçeyle hamur dökün; yüzeyde kabarcıklar oluşunca çevirin.", "Bal ya da meyveyle sıcak servis edin."],
  },
  {
    t: "Sucuklu Yumurta", c: "kahvaltilik", e: "🍳", p: 2, k: 8, s: 2, z: "KOLAY",
    d: "Sahanda kızaran sucuk dilimlerinin üzerine kırılan yumurtalarla hazırlanan pratik kahvaltılık.",
    i: [["yumurta", 4, "adet", "e"], ["sucuk", 100, "g", "e"], ["tereyağı", 1, "tk", "o"], ["pul biber", 1, "ck", "o"]],
    st: ["Sucuğu ince dilimleyin.", "Sahanda tereyağını eritip sucukları iki yüzü kızarana kadar çevirin.", "Yumurtaları sucukların üzerine kırın.", "Kapağı kapatıp beyazlar pişene kadar 3-4 dakika pişirin.", "Sıcak servis edin."],
  },
  {
    t: "Çılbır", c: "kahvaltilik", e: "🍳", p: 5, k: 10, s: 2, z: "ORTA",
    d: "Poşe yumurtaların sarımsaklı yoğurt yatağında pul biberli tereyağıyla servis edildiği Osmanlı lezzeti.",
    i: [["yumurta", 4, "adet", "e"], ["yoğurt", 1.5, "sb", "e"], ["sarımsak", 1, "dis"], ["tereyağı", 2, "yk"], ["pul biber", 1, "tk"], ["sirke", 1, "yk"], ["tuz", 1, "ck"]],
    st: ["Yoğurdu ezilmiş sarımsak ve tuzla karıştırıp tabaklara yayın.", "Kaynayan suya sirke ekleyip kısık ateşe alın.", "Yumurtaları tek tek kaseye kırıp suya bırakın, 3-4 dakika poşe edin.", "Yumurtaları süzgeçli kepçeyle alıp yoğurdun üzerine yerleştirin.", "Tereyağında pul biberi kızdırıp üzerine gezdirin."],
  },
  {
    t: "Peynirli Omlet", c: "kahvaltilik", e: "🧀", p: 5, k: 5, s: 1, z: "KOLAY",
    d: "Beyaz peynir ve maydanozla hazırlanan, 10 dakikada hazır yumuşak omlet.",
    i: [["yumurta", 2, "adet", "e"], ["beyaz peynir", 40, "g"], ["süt", 2, "yk", "o"], ["maydanoz", 3, "adet", "o", "dal"], ["tereyağı", 1, "tk"], ["karabiber", 1, "tutam", "o"]],
    st: ["Yumurtaları süt ve karabiberle çırpın.", "Tavada tereyağını eritin.", "Yumurtayı döküp kenarları pişmeye başlayınca ufalanmış peyniri serpin.", "Kıyılmış maydanozu ekleyip omleti ikiye katlayın.", "1 dakika daha pişirip servis edin."],
  },
  {
    t: "Yumurtalı Ekmek", c: "kahvaltilik", e: "🍞", p: 5, k: 10, s: 2, z: "KOLAY",
    d: "Bayat ekmeklerin sütlü yumurtaya bulanıp kızartıldığı, israfı önleyen pratik kahvaltılık.",
    i: [["bayat ekmek", 4, "dilim", "e"], ["yumurta", 2, "adet", "e"], ["süt", 0.25, "sb", "o"], ["tuz", 1, "tutam"], ["sıvı yağ", 3, "yk"]],
    st: ["Yumurta, süt ve tuzu derin bir tabakta çırpın.", "Ekmek dilimlerini iki yüzünü de karışıma batırın.", "Tavada yağı ısıtın.", "Ekmekleri iki yüzü altın rengi olana kadar kızartın.", "Kağıt havluya alıp sıcak servis edin."],
  },
  {
    t: "Pişi", c: "kahvaltilik", e: "🫓", p: 60, k: 15, s: 4, z: "ORTA",
    d: "Mayalı hamurun kızgın yağda kabarıp kızardığı, peynir ve reçelle yenen kahvaltı hamuru.",
    i: [["un", 3, "sb", "e"], ["instant maya", 1, "tk", "e"], ["süt", 0.5, "sb"], ["toz şeker", 1, "tk"], ["tuz", 1, "tk"], ["sıvı yağ", 2, "sb", "", "kızartmak için"], ["su", 0.5, "sb"]],
    st: ["Ilık süt, su, maya ve şekeri karıştırın.", "Un ve tuzu ekleyip yumuşak bir hamur yoğurun.", "Üzeri kapalı olarak 45 dakika mayalandırın.", "Bezeler koparıp elle açın, ortalarına delik açın.", "Kızgın yağda iki yüzü kızarana kadar kızartın."],
  },
  {
    t: "Kuymak", c: "kahvaltilik", e: "🧀", p: 5, k: 15, s: 2, z: "ORTA",
    d: "Mısır unu ve tereyağının peynirle uzayan bir kıvama geldiği Karadeniz kahvaltılığı.",
    i: [["mısır unu", 3, "yk", "e"], ["tereyağı", 2, "yk", "e"], ["kaşar peyniri", 150, "g", "e"], ["tuz", 1, "tutam"], ["su", 1, "sb"]],
    st: ["Tereyağını tavada eritin.", "Mısır ununu ekleyip 2-3 dakika kavurun.", "Suyu ve tuzu ekleyip sürekli karıştırarak koyulaştırın.", "Rendelenmiş peyniri ekleyin, karıştırmadan eriyip yağ salana kadar pişirin.", "Tavada sıcak servis edin."],
  },
  {
    t: "Patatesli Yumurta", c: "kahvaltilik", e: "🥔", p: 10, k: 15, s: 2, z: "KOLAY",
    d: "Küp patateslerin tavada kızarıp yumurtayla bağlandığı doyurucu kahvaltılık.",
    i: [["patates", 2, "adet", "e"], ["yumurta", 3, "adet", "e"], ["sıvı yağ", 3, "yk"], ["tuz", 1, "ck"], ["karabiber", 1, "tutam", "o"], ["pul biber", 1, "tutam", "o"]],
    st: ["Patatesleri küçük küp doğrayın.", "Tavada yağı ısıtıp patatesleri yumuşayıp kızarana kadar 10 dakika pişirin.", "Tuzlayın.", "Yumurtaları üzerine kırıp karıştırarak ya da sahanda pişirin.", "Baharatlarla servis edin."],
  },
  {
    t: "Ispanaklı Yumurta", c: "kahvaltilik", e: "🥬", p: 5, k: 10, s: 2, z: "KOLAY",
    d: "Taze ıspanağın soğanla sotelenip yumurtayla buluştuğu hafif kahvaltılık.",
    i: [["ıspanak", 250, "g", "e"], ["yumurta", 3, "adet", "e"], ["kuru soğan", 0.5, "adet", "o"], ["zeytinyağı", 2, "yk"], ["tuz", 1, "ck"], ["pul biber", 1, "tutam", "o"]],
    st: ["Ispanağı yıkayıp doğrayın.", "Zeytinyağında soğanı kavurun.", "Ispanağı ekleyip sönene kadar pişirin, tuzlayın.", "Ortasında çukurlar açıp yumurtaları kırın.", "Kapağı kapatıp yumurtalar pişene kadar 4-5 dakika pişirin."],
  },
  {
    t: "Yulaf Lapası", c: "kahvaltilik", e: "🥣", p: 2, k: 8, s: 1, z: "KOLAY",
    d: "Yulaf ezmesinin sütle pişip meyve ve tarçınla tatlandırıldığı lifli kahvaltı.",
    i: [["yulaf ezmesi", 0.5, "sb", "e"], ["süt", 1, "sb", "e"], ["muz", 1, "adet", "o"], ["bal", 1, "tk", "o"], ["tarçın", 1, "tutam", "o"], ["ceviz", 1, "yk", "o"]],
    st: ["Yulaf ve sütü küçük bir tencereye alın.", "Orta ateşte karıştırarak 5-6 dakika koyulaşana kadar pişirin.", "Kaseye alın.", "Dilimlenmiş muz, ceviz ve tarçın ekleyin.", "Balla tatlandırıp servis edin."],
  },
  {
    t: "Krep", c: "kahvaltilik", e: "🥞", p: 10, k: 20, s: 4, z: "KOLAY",
    d: "İnce ve esnek, tatlı ya da tuzlu iç malzemelerle dürüm yapılabilen Fransız usulü krep.",
    i: [["un", 1, "sb", "e"], ["süt", 1.5, "sb", "e"], ["yumurta", 2, "adet", "e"], ["sıvı yağ", 1, "yk"], ["tuz", 1, "tutam"], ["toz şeker", 1, "yk", "o"]],
    st: ["Tüm malzemeleri pürüzsüz, akışkan bir hamur olana kadar çırpın.", "Hamuru 10 dakika dinlendirin.", "Yapışmaz tavayı ısıtıp hafifçe yağlayın.", "Kepçeyle ince bir tabaka dökün, tavayı çevirerek yayın; altı pişince çevirin.", "İstediğiniz iç malzemeyle dürüp servis edin."],
  },
];
