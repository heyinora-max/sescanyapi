# -*- coding: utf-8 -*-
"""
Ses Can Yapı — alan adı değiştirme aracı
=========================================

Site şu an GitHub'ın verdiği adreste yayında:
    https://heyinora-max.github.io/sescanyapi/

Müşteri kendi alan adını aldığında (örn. sescanyapi.com) sitedeki bütün
mutlak adreslerin — canonical, og:url, og:image, sitemap, robots — yeni
adrese dönmesi gerekiyor. Bunları elle değiştirmek 35 satırı elle
düzeltmek demek; bu araç hepsini tek seferde yapar ve GitHub Pages'in
istediği CNAME dosyasını da yazar.

KULLANIM
    python araclar/alan-adi.py sescanyapi.com
    python araclar/alan-adi.py --geri-al          (GitHub adresine döner)

SONRASINDA YAPILACAK (alan adı sağlayıcısının panelinde)
    A     @     185.199.108.153
    A     @     185.199.109.153
    A     @     185.199.110.153
    A     @     185.199.111.153
    CNAME www   heyinora-max.github.io

Ardından GitHub deposunda Settings > Pages > Custom domain alanına aynı
alan adını yazıp "Enforce HTTPS" işaretlenir.
"""
import io
import os
import re
import sys

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GITHUB_ADRES = "https://heyinora-max.github.io/sescanyapi"

UZANTILAR = (".html", ".xml", ".txt", ".md", ".js", ".webmanifest")
ATLA = {".git", "assets", "araclar", "node_modules"}


def dosyalar():
    for kok, dizinler, adlar in os.walk(KOK):
        dizinler[:] = [d for d in dizinler if d not in ATLA]
        for ad in adlar:
            if ad.endswith(UZANTILAR):
                yield os.path.join(kok, ad)


def suanki_adres():
    """CNAME varsa oradaki alan adı, yoksa GitHub adresi."""
    cname = os.path.join(KOK, "CNAME")
    if os.path.exists(cname):
        alan = io.open(cname, encoding="utf-8").read().strip()
        if alan:
            return "https://" + alan
    return GITHUB_ADRES


def degistir(eski, yeni):
    sayac = 0
    dokunulan = []
    for yol in dosyalar():
        metin = io.open(yol, encoding="utf-8").read()
        if eski not in metin:
            continue
        yenisi = metin.replace(eski, yeni)
        io.open(yol, "w", encoding="utf-8", newline="\n").write(yenisi)
        adet = metin.count(eski)
        sayac += adet
        dokunulan.append((os.path.relpath(yol, KOK), adet))
    return sayac, dokunulan


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    arg = sys.argv[1].strip()
    eski = suanki_adres()

    if arg in ("--geri-al", "-g"):
        yeni = GITHUB_ADRES
        cname = os.path.join(KOK, "CNAME")
        if os.path.exists(cname):
            os.remove(cname)
            print("CNAME silindi.")
    else:
        alan = re.sub(r"^https?://", "", arg).strip("/").lower()
        if not re.match(r"^[a-z0-9.-]+\.[a-z]{2,}$", alan):
            print("Geçerli bir alan adı değil:", arg)
            return 1
        yeni = "https://" + alan
        io.open(os.path.join(KOK, "CNAME"), "w", encoding="utf-8", newline="\n").write(alan + "\n")
        print("CNAME yazıldı:", alan)

    if eski == yeni:
        print("Adres zaten", yeni, "— değişiklik yok.")
        return 0

    sayac, dokunulan = degistir(eski, yeni)
    print("\n%s  ->  %s" % (eski, yeni))
    print("%d adres, %d dosyada güncellendi:\n" % (sayac, len(dokunulan)))
    for ad, adet in sorted(dokunulan):
        print("   %-22s %d" % (ad, adet))

    print("\nSıradaki adımlar:")
    print("  1. git add -A && git commit && git push")
    if arg not in ("--geri-al", "-g"):
        print("  2. Alan adı panelinde A kayıtları: 185.199.108-111.153, CNAME www -> heyinora-max.github.io")
        print("  3. GitHub > Settings > Pages > Custom domain =", yeni.replace("https://", ""))
        print("  4. 'Enforce HTTPS' işaretlensin (sertifika birkaç dakikada çıkar)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
