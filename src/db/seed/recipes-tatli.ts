import type { RecipeSeed } from "./types";

export const tatlilar: RecipeSeed[] = [
  {
    t: "Sütlaç", c: "tatli", e: "🍮", p: 10, k: 40, s: 6, z: "KOLAY",
    d: "Pirinç ve sütün ağır ateşte birlikte piştiği, tarçınla servis edilen hafif sütlü tatlı.",
    i: [["süt", 1, "l", "e"], ["pirinç", 0.5, "sb", "e"], ["toz şeker", 1, "sb"], ["pirinç unu", 2, "yk", "o"], ["vanilin", 1, "pk", "o"], ["tarçın", 1, "ck", "o"], ["su", 1, "sb"]],
    st: ["Pirinci 1 su bardağı suda suyunu çekene kadar haşlayın.", "Sütü ekleyip kaynatın, kısık ateşte 20 dakika pişirin.", "Şekeri ekleyin; pirinç ununu biraz soğuk sütle açıp karıştırarak ilave edin.", "Koyulaşana kadar 10 dakika daha pişirin, vanilini ekleyin.", "Kaselere paylaştırıp soğutun; tarçınla servis edin."],
  },
  {
    t: "Revani", c: "tatli", e: "🍰", p: 15, k: 35, s: 12, z: "ORTA",
    d: "İrmikli kek tabanının soğuk şerbetle buluşup yumuşacık olduğu şerbetli tatlı.",
    i: [["irmik", 1, "sb", "e"], ["un", 1, "sb"], ["yumurta", 4, "adet", "e"], ["toz şeker", 3, "sb"], ["yoğurt", 1, "sb"], ["sıvı yağ", 0.5, "sb"], ["kabartma tozu", 1, "pk"], ["limon", 0.5, "adet"], ["su", 3, "sb"]],
    st: ["Şerbet için 2 su bardağı şeker ve suyu 15 dakika kaynatın, limon sıkıp soğumaya bırakın.", "Yumurta ve 1 su bardağı şekeri köpürene kadar çırpın.", "Yoğurt ve yağı ekleyin; irmik, un ve kabartma tozunu katıp karıştırın.", "Yağlanmış tepsiye döküp 180°C fırında 30-35 dakika pişirin.", "Sıcak revaniye soğuk şerbeti dökün, şerbeti çekince dilimleyin."],
  },
  {
    t: "Kakaolu Kek", c: "tatli", e: "🍫", p: 15, k: 40, s: 10, z: "KOLAY",
    d: "Evdeki temel malzemelerle hazırlanan, çayın yanına yakışan yumuşak kakaolu kek.",
    i: [["un", 2, "sb", "e"], ["yumurta", 3, "adet", "e"], ["toz şeker", 1, "sb"], ["süt", 1, "sb"], ["sıvı yağ", 0.75, "sb"], ["kakao", 3, "yk"], ["kabartma tozu", 1, "pk"], ["vanilin", 1, "pk", "o"]],
    st: ["Fırını 175°C'ye ısıtın, kalıbı yağlayıp unlayın.", "Yumurta ve şekeri köpük köpük olana kadar çırpın.", "Süt ve yağı ekleyip karıştırın.", "Elenmiş un, kakao, kabartma tozu ve vanilini ekleyip yavaşça karıştırın.", "Kalıba döküp 35-40 dakika pişirin; kürdan temiz çıkarsa fırından alın."],
  },
  {
    t: "Muhallebi", c: "tatli", e: "🍮", p: 5, k: 20, s: 6, z: "KOLAY",
    d: "Süt, nişasta ve unla hazırlanan, üzerine tarçın ya da hindistan cevizi serpilen sade sütlü tatlı.",
    i: [["süt", 1, "l", "e"], ["toz şeker", 1, "sb"], ["mısır nişastası", 2, "yk"], ["un", 2, "yk"], ["tereyağı", 1, "yk", "o"], ["vanilin", 1, "pk", "o"], ["tarçın", 1, "ck", "o"]],
    st: ["Süt, şeker, nişasta ve unu tencerede soğukken çırpın.", "Orta ateşte sürekli karıştırarak koyulaşıp kaynayana kadar pişirin.", "Ocaktan alıp tereyağı ve vanilini ekleyin.", "Mikserle 1-2 dakika çırpıp kaselere paylaştırın.", "Soğuduktan sonra buzdolabında dinlendirip tarçınla servis edin."],
  },
  {
    t: "İrmik Helvası", c: "tatli", e: "🍯", p: 5, k: 30, s: 6, z: "KOLAY",
    d: "İrmiğin tereyağında kavrulup sütlü şerbetle demlendiği, fıstık ya da çam fıstığıyla zenginleşen geleneksel helva.",
    i: [["irmik", 2, "sb", "e"], ["tereyağı", 125, "g"], ["süt", 2, "sb"], ["toz şeker", 1.5, "sb"], ["dolmalık fıstık", 2, "yk", "o"], ["su", 1, "sb"]],
    st: ["Süt, su ve şekeri şeker eriyene kadar ısıtın.", "Tereyağını eritip irmik ve fıstığı ekleyin.", "Kısık ateşte sürekli karıştırarak irmik pembeleşene kadar 20-25 dakika kavurun.", "Sıcak şerbeti dikkatlice dökün, karıştırıp kapağını kapatın.", "Kısık ateşte suyunu çekince ocaktan alıp 10 dakika demlendirin."],
  },
  {
    t: "Un Helvası", c: "tatli", e: "🍯", p: 5, k: 25, s: 6, z: "ORTA",
    d: "Unun tereyağında sabırla kavrulup şerbetle buluştuğu, kaşıkla şekil verilerek servis edilen helva.",
    i: [["un", 2, "sb", "e"], ["tereyağı", 150, "g", "e"], ["toz şeker", 1.5, "sb"], ["süt", 1, "sb"], ["su", 1, "sb"], ["ceviz", 0.5, "sb", "o"]],
    st: ["Süt, su ve şekeri kaynatıp şerbet hazırlayın.", "Tereyağını eritip unu ekleyin.", "Kısık ateşte sürekli karıştırarak un açık kahverengi olup kokusu çıkana kadar kavurun.", "Şerbeti azar azar ekleyip hızla karıştırın.", "Kıvam alınca 10 dakika demlendirip kaşıkla şekil vererek cevizle servis edin."],
  },
  {
    t: "Supangle", c: "tatli", e: "🍫", p: 10, k: 15, s: 6, z: "KOLAY",
    d: "Yoğun kakaolu, kadifemsi pudingin bisküvi tabanla katmanlandığı sevilen sütlü tatlı.",
    i: [["süt", 1, "l", "e"], ["kakao", 3, "yk", "e"], ["toz şeker", 1, "sb"], ["un", 3, "yk"], ["mısır nişastası", 2, "yk"], ["tereyağı", 1, "yk"], ["bitter çikolata", 50, "g", "o"], ["bisküvi", 1, "pk", "o"]],
    st: ["Süt, şeker, kakao, un ve nişastayı soğukken çırpın.", "Orta ateşte karıştırarak koyulaşana kadar pişirin.", "Ocaktan alıp tereyağı ve çikolatayı ekleyip eritin.", "İsterseniz kase tabanına bisküvi koyup pudingi üzerine dökün.", "Soğutup buzdolabında en az 2 saat bekletin."],
  },
  {
    t: "Keşkül", c: "tatli", e: "🥥", p: 10, k: 20, s: 6, z: "KOLAY",
    d: "Badem ve hindistan cevizi aromalı, Osmanlı mutfağından gelen sütlü tatlı.",
    i: [["süt", 1, "l", "e"], ["toz badem", 0.5, "sb", "e"], ["toz şeker", 1, "sb"], ["pirinç unu", 2, "yk"], ["mısır nişastası", 1, "yk"], ["yumurta", 1, "adet", "o", "sarısı"], ["hindistan cevizi", 2, "yk", "o"]],
    st: ["Süt, şeker, pirinç unu, nişasta ve yumurta sarısını çırpın.", "Orta ateşte karıştırarak kaynayana kadar pişirin.", "Toz bademi ekleyip 3-4 dakika daha pişirin.", "Kaselere paylaştırın.", "Soğuyunca hindistan cevizi serperek servis edin."],
  },
  {
    t: "Kabak Tatlısı", c: "tatli", e: "🎃", p: 10, k: 50, s: 6, z: "KOLAY",
    d: "Balkabağının şekerle kendi suyunda piştiği, tahin ve cevizle servis edilen kış tatlısı.",
    i: [["balkabağı", 1, "kg", "e"], ["toz şeker", 1.5, "sb"], ["ceviz", 0.5, "sb", "o"], ["tahin", 2, "yk", "o"]],
    st: ["Balkabağını soyup iri dilimler halinde kesin.", "Tencereye dizip üzerine şekeri serpin, bir gece bekletip suyunu salmasını sağlayın.", "Su eklemeden kapağı kapalı, kısık ateşte 40-50 dakika pişirin.", "Soğumaya bırakın.", "Tahin ve dövülmüş cevizle servis edin."],
  },
  {
    t: "Şekerpare", c: "tatli", e: "🍪", p: 25, k: 30, s: 20, z: "ORTA",
    d: "İrmikli yumuşak hamurun fırında pişip şerbetle tatlandırıldığı, bademle süslenen klasik tatlı.",
    i: [["un", 2, "sb", "e"], ["irmik", 0.5, "sb"], ["tereyağı", 125, "g", "e"], ["pudra şekeri", 0.5, "sb"], ["yumurta", 1, "adet"], ["kabartma tozu", 1, "pk"], ["toz şeker", 2.5, "sb"], ["badem", 20, "adet", "o"], ["limon", 0.5, "adet"], ["su", 2.5, "sb"]],
    st: ["Şeker ve suyu 15 dakika kaynatıp limon sıkın, soğutun.", "Oda sıcaklığındaki tereyağı, pudra şekeri ve yumurtayı karıştırın.", "İrmik, un ve kabartma tozunu ekleyip yumuşak hamur yoğurun.", "Ceviz büyüklüğünde parçaları yuvarlayıp tepsiye dizin, ortalarına badem bastırın.", "180°C fırında kızarana kadar 25-30 dakika pişirin; sıcakken soğuk şerbeti dökün."],
  },
  {
    t: "Magnolia", c: "tatli", e: "🍌", p: 20, k: 10, s: 6, z: "KOLAY",
    d: "Hafif sütlü krema, bisküvi kırıntısı ve muzun katmanlandığı popüler kup tatlısı.",
    i: [["süt", 3, "sb", "e"], ["un", 2, "yk"], ["mısır nişastası", 1, "yk"], ["toz şeker", 0.5, "sb"], ["yumurta", 1, "adet", "o", "sarısı"], ["krema", 200, "ml"], ["bisküvi", 1, "pk", "e"], ["muz", 2, "adet", "o"]],
    st: ["Süt, un, nişasta, şeker ve yumurta sarısını pişirerek muhallebi hazırlayın, soğutun.", "Soğuyan muhallebiye kremayı ekleyip mikserle çırpın.", "Bisküvileri rondoda kırıntı haline getirin.", "Kuplara sırayla bisküvi, krema ve muz dilimlerini katmanlayın.", "Buzdolabında 2 saat dinlendirip servis edin."],
  },
  {
    t: "Mozaik Pasta", c: "tatli", e: "🍫", p: 20, k: 5, s: 8, z: "KOLAY",
    d: "Kakaolu sosla bağlanan bisküvi parçalarının dondurucuda şekillendiği, fırın gerektirmeyen tatlı.",
    i: [["bisküvi", 2, "pk", "e"], ["kakao", 3, "yk", "e"], ["tereyağı", 100, "g"], ["toz şeker", 0.5, "sb"], ["süt", 0.5, "sb"], ["ceviz", 0.5, "sb", "o"]],
    st: ["Bisküvileri elle iri parçalara bölün.", "Tereyağı, şeker, süt ve kakaoyu kısık ateşte eritip karıştırın.", "Sosu bisküvi ve cevizle harmanlayın.", "Streç filme alıp rulo şeklinde sarın.", "Dondurucuda 3-4 saat bekletip dilimleyerek servis edin."],
  },
  {
    t: "Fırında Elma Tatlısı", c: "tatli", e: "🍎", p: 15, k: 30, s: 4, z: "KOLAY",
    d: "İçi cevizli harçla doldurulan elmaların tarçınla fırında piştiği hafif meyve tatlısı.",
    i: [["elma", 4, "adet", "e"], ["ceviz", 0.5, "sb"], ["toz şeker", 3, "yk"], ["tarçın", 1, "ck"], ["tereyağı", 1, "yk"], ["su", 0.5, "sb"]],
    st: ["Elmaları soyup ikiye bölün, çekirdek yuvalarını oyun.", "Dövülmüş ceviz, şeker ve tarçını karıştırın.", "Elmaları fırın kabına dizip yuvalara harcı doldurun, üzerine tereyağı koyun.", "Kabın tabanına suyu dökün.", "180°C fırında elmalar yumuşayana kadar 25-30 dakika pişirin."],
  },
  {
    t: "Lokma", c: "tatli", e: "🍩", p: 70, k: 20, s: 8, z: "ORTA",
    d: "Mayalı hamurun kızgın yağda kızartılıp şerbete batırıldığı çıtır şerbetli tatlı.",
    i: [["un", 2, "sb", "e"], ["instant maya", 1, "pk", "e"], ["toz şeker", 2.5, "sb"], ["sıvı yağ", 3, "sb", "", "kızartmak için"], ["limon", 0.5, "adet"], ["tuz", 1, "tutam"], ["su", 3, "sb"]],
    st: ["Şerbet için 2 su bardağı şeker ve suyu kaynatıp limon sıkın, soğutun.", "Un, maya, 1 yemek kaşığı şeker, tuz ve ılık suyla akışkan bir hamur hazırlayın.", "Hamuru üzeri kapalı 1 saat mayalandırın.", "Islak kaşıkla ya da avuçla küçük parçalar halinde kızgın yağa bırakın, altın rengi olana kadar kızartın.", "Lokmaları soğuk şerbete batırıp çıkarın."],
  },
  {
    t: "Ayva Tatlısı", c: "tatli", e: "🍐", p: 15, k: 50, s: 4, z: "KOLAY",
    d: "Ayvaların karanfil ve şekerle pembe renk alana kadar piştiği, kaymakla servis edilen tatlı.",
    i: [["ayva", 2, "adet", "e"], ["toz şeker", 1, "sb"], ["karanfil", 4, "adet", "o"], ["kaymak", 4, "yk", "o"], ["su", 1.5, "sb"]],
    st: ["Ayvaları soyup ikiye bölün, çekirdeklerini çıkarın; çekirdekleri atmayın.", "Ayvaları tencereye dizin, şekeri serpin, karanfil ve çekirdekleri ekleyin.", "Suyu ekleyip kapağı kapalı, kısık ateşte 45-50 dakika pişirin.", "Şerbeti ara ara üzerlerine gezdirin; renk aldıkça pişirmeyi tamamlayın.", "Soğuyunca kaymakla servis edin."],
  },
  {
    t: "Tahinli Kurabiye", c: "tatli", e: "🍪", p: 20, k: 20, s: 20, z: "KOLAY",
    d: "Tahinin nefis aromasıyla hazırlanan, ağızda dağılan yumuşak kurabiyeler.",
    i: [["tahin", 0.5, "sb", "e"], ["un", 2.5, "sb", "e"], ["toz şeker", 0.5, "sb"], ["sıvı yağ", 0.5, "sb"], ["kabartma tozu", 0.5, "pk"], ["susam", 2, "yk", "o"]],
    st: ["Tahin, şeker ve yağı karıştırın.", "Un ve kabartma tozunu ekleyip ele yapışmayan yumuşak bir hamur yoğurun.", "Ceviz büyüklüğünde parçalar koparıp yuvarlayın, üstlerini susama bastırın.", "Yağlı kağıt serili tepsiye aralıklı dizin.", "170°C fırında altları hafif kızarana kadar 18-20 dakika pişirin."],
  },
];
