from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Image, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT_PATH = Path("/Users/theresiaaquila/Documents/NutriCore AI/docs/NutriCore_AI_Panduan_Penggunaan.pdf")
LOGO_PATH = Path("/Users/theresiaaquila/Documents/NutriCore AI/app/assets/images/nutricore-welcome-logo.png")


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleNavy",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=28,
            leading=34,
            textColor=colors.white,
            alignment=1,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TitleGreen",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#102A6D"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubtleLight",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#DCE7F5"),
            alignment=1,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Subtle",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#61728A"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#1F4E94"),
            spaceBefore=8,
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BodyCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=17,
            textColor=colors.HexColor("#10233F"),
            spaceAfter=8,
        )
    )
    styles.add(
        ParagraphStyle(
            name="BulletCustom",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#10233F"),
            leftIndent=14,
            bulletIndent=0,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Quote",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=18,
            textColor=colors.HexColor("#102A6D"),
            backColor=colors.HexColor("#EEF7F0"),
            borderPadding=10,
            borderColor=colors.HexColor("#D8E9DA"),
            borderWidth=1,
            borderRadius=8,
            spaceAfter=10,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCell",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.4,
            leading=10.5,
            textColor=colors.HexColor("#10233F"),
            spaceAfter=0,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableHead",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=8.8,
            leading=11,
            textColor=colors.HexColor("#102A6D"),
            spaceAfter=0,
        )
    )
    return styles


def bullet(text: str, styles):
    return Paragraph(text, styles["BulletCustom"], bulletText="•")


def build_mock_screen(styles, title: str, accent_hex: str, body_lines: list[str]):
    top_bar = Table(
        [[Paragraph(f"<b>{title}</b>", styles["BodyCustom"])]],
        colWidths=[38 * mm],
    )
    top_bar.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(accent_hex)),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    body_rows = [[Paragraph(line, styles["Subtle"])] for line in body_lines]
    body_table = Table(body_rows, colWidths=[38 * mm])
    body_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#E5EDF3")),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    status_bar = Table(
        [[Paragraph("9:41", styles["Subtle"]), Paragraph(" ", styles["Subtle"]), Paragraph("100%", styles["Subtle"])]],
        colWidths=[10 * mm, 18 * mm, 10 * mm],
    )
    status_bar.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("ALIGN", (0, 0), (0, 0), "LEFT"),
                ("ALIGN", (2, 0), (2, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    home_indicator = Table([[""]], colWidths=[14 * mm], rowHeights=[1.4 * mm])
    home_indicator.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
            ]
        )
    )
    phone = Table([[status_bar], [top_bar], [body_table], [home_indicator]], colWidths=[40 * mm])
    phone.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("BOX", (0, 0), (-1, -1), 2, colors.HexColor("#111827")),
                ("ROUNDEDCORNERS", [14, 14, 14, 14]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (0, 3), (0, 3), "CENTER"),
            ]
        )
    )
    return phone


def build_label_mock_screen(styles):
    status_bar = Table(
        [[Paragraph("9:41", styles["Subtle"]), Paragraph(" ", styles["Subtle"]), Paragraph("100%", styles["Subtle"])]],
        colWidths=[10 * mm, 18 * mm, 10 * mm],
    )
    status_bar.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                ("ALIGN", (0, 0), (0, 0), "LEFT"),
                ("ALIGN", (2, 0), (2, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    action_row = Table(
        [[
            Paragraph("<b>Galeri</b>", styles["BodyCustom"]),
            Paragraph("<b>Kamera</b>", styles["BodyCustom"]),
        ]],
        colWidths=[17 * mm, 17 * mm],
    )
    action_row.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#1F4E94")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#EEF4F8")),
                ("TEXTCOLOR", (0, 0), (0, 0), colors.white),
                ("TEXTCOLOR", (1, 0), (1, 0), colors.HexColor("#1F4E94")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
                ("LEFTPADDING", (0, 0), (-1, -1), 2),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("BOX", (1, 0), (1, 0), 0.6, colors.HexColor("#DCE5EE")),
            ]
        )
    )
    phone_preview = Table(
        [[
            "",
            Table([[""]], colWidths=[10 * mm], rowHeights=[24 * mm]),
            "",
        ]],
        colWidths=[10 * mm, 12 * mm, 10 * mm],
        rowHeights=[28 * mm],
    )
    phone_preview.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#AEB7C3")),
                ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#8D2B1F")),
                ("BOX", (1, 0), (1, 0), 2, colors.HexColor("#5DBD4E")),
                ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    crop_tag = Table([[Paragraph("<b>Crop Box</b>", styles["SubtleLight"])]], colWidths=[14 * mm])
    crop_tag.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#1E293B")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    crop_section = Table(
        [
            [crop_tag],
            [phone_preview],
            [Paragraph("Geser crop ke area Informasi Nilai Gizi", styles["Subtle"])],
        ],
        colWidths=[34 * mm],
    )
    crop_section.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E5E7EB")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#CBD5E1")),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (0, 1), (0, 1), "CENTER"),
            ]
        )
    )
    scan_button = Table(
        [[Paragraph("<b>Scan & Analisis</b>", styles["BodyCustom"])]],
        colWidths=[34 * mm],
    )
    scan_button.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#2FB34A")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("ROUNDEDCORNERS", [10, 10, 10, 10]),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    body = Table(
        [
            [action_row],
            [crop_section],
            [Paragraph("Energi / Karbo / Gula", styles["Subtle"])],
            [scan_button],
            [Paragraph("Status hijau / kuning / merah", styles["Subtle"])],
        ],
        colWidths=[36 * mm],
    )
    body.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("BOX", (0, 0), (-1, -1), 0.35, colors.HexColor("#E5EDF3")),
            ]
        )
    )
    home_indicator = Table([[""]], colWidths=[14 * mm], rowHeights=[1.4 * mm])
    home_indicator.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
                ("ROUNDEDCORNERS", [3, 3, 3, 3]),
            ]
        )
    )
    phone = Table([[status_bar], [body], [home_indicator]], colWidths=[40 * mm])
    phone.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#111827")),
                ("BOX", (0, 0), (-1, -1), 2, colors.HexColor("#111827")),
                ("ROUNDEDCORNERS", [14, 14, 14, 14]),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("ALIGN", (0, 2), (0, 2), "CENTER"),
            ]
        )
    )
    return phone


def build_visual_step_card(styles, step_number: int, title: str, subtitle: str, accent_hex: str, lines: list[str], phone_lines: list[str]):
    badge = Paragraph(f"<font color='#FFFFFF'><b>STEP {step_number}</b></font>", styles["BodyCustom"])
    left = [
        [Table([[badge]], colWidths=[24 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(accent_hex)),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ]))],
        [Paragraph(title, styles["Section"])],
        [Paragraph(subtitle, styles["BodyCustom"])],
    ]
    for line in lines:
        left.append([bullet(line, styles)])
    left_table = Table(left, colWidths=[100 * mm])
    left_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    mock = build_label_mock_screen(styles) if "Label" in title else build_mock_screen(styles, title, accent_hex, phone_lines)
    card = Table(
        [[left_table, mock]],
        colWidths=[108 * mm, 50 * mm],
    )
    card.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FBFD")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#DCE5EE")),
                ("ROUNDEDCORNERS", [12, 12, 12, 12]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return card


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor("#DCE5EE"))
    canvas.line(20 * mm, 12 * mm, 190 * mm, 12 * mm)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#61728A"))
    canvas.drawString(20 * mm, 7 * mm, "NutriCore AI Guide")
    canvas.drawRightString(190 * mm, 7 * mm, f"Halaman {doc.page}")
    canvas.restoreState()


def build_story():
    styles = build_styles()
    story = []

    cover_logo = Image(str(LOGO_PATH), width=34 * mm, height=36 * mm) if LOGO_PATH.exists() else Paragraph("", styles["BodyCustom"])
    cover_text = Table(
        [
            [Paragraph("NutriCore AI - Panduan Penggunaan Aplikasi", styles["TitleNavy"])],
        ],
        colWidths=[110 * mm],
    )
    cover_text.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    cover = Table(
        [[cover_logo, cover_text]],
        colWidths=[42 * mm, 128 * mm],
    )
    cover.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0A1B3D")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#183567")),
                ("ROUNDEDCORNERS", [18, 18, 18, 18]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 18),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 18),
            ]
        )
    )
    story.append(cover)
    story.append(Spacer(1, 12))

    meta = Table(
        [
            [Paragraph("Ditujukan untuk", styles["BodyCustom"]), Paragraph("Masyarakat umum, pasien, keluarga, petugas gizi, dokter, perawat, dan tenaga kesehatan lain.", styles["BodyCustom"])],
            [Paragraph("Developer", styles["BodyCustom"]), Paragraph("dr Theresia AYH", styles["BodyCustom"])],
            [Paragraph("Bulan & Tahun", styles["BodyCustom"]), Paragraph("April 2026", styles["BodyCustom"])],
        ],
        colWidths=[44 * mm, 122 * mm],
    )
    meta.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EEF4F8")),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#102A6D")),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#DCE5EE")),
                ("BACKGROUND", (1, 0), (1, -1), colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("PADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(meta)
    story.append(Spacer(1, 10))
    story.append(Paragraph("“Understand Your Body, Live Better.”", styles["Quote"]))
    story.append(
        Paragraph(
            "Panduan ini dirancang agar dapat diakses dari dalam aplikasi, dibagikan melalui WhatsApp atau Email, dan langsung dicetak dalam bentuk PDF.",
            styles["BodyCustom"],
        )
    )
    story.append(Spacer(1, 8))
    story.append(Paragraph("Quick Start 1 Menit", styles["Section"]))
    quick_start = Table(
        [
            [
                Paragraph("<b>1.</b> Buka aplikasi dan pilih <b>Mode Pribadi</b> atau <b>Mode Profesional</b> dari halaman depan.", styles["BodyCustom"]),
                Paragraph("<b>2.</b> Isi data pasien dasar, lalu tekan <b>Analisis Status Gizi</b>.", styles["BodyCustom"]),
            ],
            [
                Paragraph("<b>3.</b> Lihat ringkasan, target nutrisi otomatis, SOAP, dan bila perlu growth chart.", styles["BodyCustom"]),
                Paragraph("<b>4.</b> Gunakan <b>Track</b>, <b>Label</b>, dan <b>Recipe</b>, lalu ekspor PDF atau Excel bila diperlukan.", styles["BodyCustom"]),
            ],
        ],
        colWidths=[82 * mm, 82 * mm],
    )
    quick_start.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FBFD")),
                ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#DCE5EE")),
                ("INNERGRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#E5EDF3")),
                ("ROUNDEDCORNERS", [12, 12, 12, 12]),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(quick_start)
    story.append(PageBreak())

    sections = [
        (
            "1. Latar Belakang & Sejarah Pembuatan",
            [
                "NutriCore AI lahir dari realitas yang sering ditemui dalam praktik klinis sehari-hari. Banyak individu, baik yang sehat maupun yang memiliki penyakit, mengalami kesulitan dalam memahami kebutuhan tubuhnya sendiri.",
                "Informasi tentang diet dan kesehatan tersedia sangat luas, namun sering kali terlalu kompleks, tidak terintegrasi, bahkan saling bertentangan.",
                "Kondisi ini menjadi semakin sulit pada pasien dengan lebih dari satu penyakit seperti diabetes, hipertensi, dan gangguan ginjal, di mana setiap kondisi memiliki aturan diet yang berbeda dan berpotensi saling bertabrakan.",
                "Sebagai seorang dokter, pengembang melihat langsung bahwa pasien sering bingung harus makan apa, rekomendasi diet sulit diterapkan dalam kehidupan sehari-hari, dan pendekatan yang ada belum cukup personal.",
                "Dari titik inilah muncul gagasan untuk menghadirkan sebuah sistem yang mampu memahami tubuh manusia secara menyeluruh, lalu menerjemahkannya menjadi panduan sederhana yang bisa dijalani setiap hari.",
            ],
        ),
        (
            "2. Arti Nama",
            [
                "Nutri menggambarkan nutrisi sebagai fondasi utama kesehatan dan kehidupan.",
                "Core melambangkan inti tubuh manusia: metabolisme, keseimbangan internal, dan pusat kendali kesehatan.",
                "AI mewakili kecerdasan sistem yang mampu menganalisis, menyesuaikan, dan memberikan rekomendasi secara personal.",
                "Makna keseluruhan: teknologi cerdas yang membantu manusia memahami dan merawat inti kesehatannya.",
            ],
        ),
        (
            "3. Arti & Filosofi Logo",
            [
                "Daun melambangkan kehidupan, pertumbuhan, dan pendekatan alami terhadap kesehatan.",
                "Pola sirkuit melambangkan teknologi, kecerdasan buatan, dan sistem yang bekerja secara presisi.",
                "Lingkaran melambangkan keseimbangan tubuh dan integrasi antara tubuh, nutrisi, serta teknologi.",
                "Hijau berarti kesehatan dan harapan. Biru berarti kepercayaan dan profesionalisme. Putih dan abu berarti kesederhanaan, kebersihan, dan modernitas.",
            ],
        ),
        (
            "4. Tujuan Pembuatan Aplikasi",
            [
                "Membantu individu memahami kebutuhan tubuhnya, mencapai keseimbangan metabolik, dan menjalani hidup sehat secara berkelanjutan.",
                "Membantu pengelolaan penyakit berbasis nutrisi dan mengintegrasikan berbagai guideline medis menjadi satu rekomendasi yang tidak konflik.",
                "Mengurangi kebingungan dalam memilih makanan, mengurangi rasa takut salah makan, dan memberikan rasa didampingi.",
            ],
        ),
        (
            "5. Visi & Misi",
            [
                "Visi: menjadi sistem kesehatan berbasis nutrisi dan AI yang membantu setiap individu memahami tubuhnya dan hidup lebih sehat secara berkelanjutan.",
                "Misi: menyederhanakan ilmu kesehatan menjadi panduan praktis, memberikan rekomendasi yang personal dan akurat, mengintegrasikan teknologi dengan pendekatan humanis, dan mendukung perubahan gaya hidup jangka panjang.",
            ],
        ),
        (
            "6. Konsep Utama Sistem",
            [
                "Complex Intelligence, Simple Experience.",
                "Backend bersifat kompleks karena mencakup AI, perhitungan klinis, dan multi-condition engine, sedangkan frontend dibuat sederhana, intuitif, dan tidak membingungkan.",
            ],
        ),
        (
            "7. Fitur Utama Aplikasi",
            [
                "Perhitungan kebutuhan gizi: BMR, TDEE, target energi, distribusi makronutrien, natrium, dan kebutuhan cairan.",
                "Multi-Condition Clinical Engine untuk mengelola lebih dari satu penyakit sekaligus dan menghindari konflik antar diet.",
                "Rekomendasi resep otomatis berdasarkan bahan, kebutuhan energi, dan kondisi medis pengguna, dilengkapi gram dan URT Indonesia seperti sdm, sdt, gelas belimbing, centong, mangkuk, potong, dan buah.",
                "Tracking harian untuk asupan kalori, makronutrien, dan progres pencapaian target.",
                "Menu Label khusus untuk scan foto label AKG / informasi nilai gizi produk, crop area label, OCR otomatis, dan analisis warna hijau, kuning, atau merah sesuai kondisi individu.",
                "Sinkronisasi otomatis antara Home, Track, dan Recipe agar kondisi medis, target gizi, dan hasil analisis produk tidak perlu diisi ulang berulang kali.",
                "AI Food Recognition untuk analisis foto makanan dan estimasi kalori.",
                "Rekomendasi olahraga personal.",
                "Smart Health Calendar untuk jadwal makan, olahraga, minum, dan obat.",
            ],
        ),
        (
            "8. Nilai Inti",
            [
                "Clarity, Accuracy, Humanity, Personalization, dan Sustainability.",
            ],
        ),
        (
            "9. Identitas Visual",
            [
                "Gaya visual NutriCore AI adalah minimalis, modern, elegan, dengan warna utama hijau dan biru serta tipografi sans-serif yang bersih.",
            ],
        ),
        (
            "10. Karakter Aplikasi",
            [
                "NutriCore AI dirancang terasa tenang, cerdas, tidak menghakimi, membantu tanpa memaksa, dan terasa seperti asisten pribadi, bukan alat medis yang kaku.",
            ],
        ),
        (
            "11. Positioning",
            [
                "NutriCore AI adalah Personal Metabolic Intelligence System, bukan sekadar aplikasi diet, tetapi sistem yang memahami tubuh, mengintegrasikan kondisi kesehatan, dan memberikan arahan yang realistis.",
            ],
        ),
        (
            "12. Cara Menggunakan Aplikasi",
            [
                "Saat aplikasi pertama dibuka, pengguna akan melihat halaman depan welcome yang modern tanpa menu bawah, sehingga fokus utama langsung ke pilihan penggunaan.",
                "Di halaman depan tersedia tiga aksi utama: Mulai Mode Pribadi, Masuk Mode Profesional, dan Lihat Panduan.",
                "Mode Pribadi menampilkan form yang lebih ringkas untuk catatan personal. Mode Profesional menampilkan data resmi yang lebih lengkap untuk klinik, puskesmas, rumah sakit, atau institusi lain.",
                "Setelah memilih mode di halaman depan, pengguna masuk ke menu Home dan tidak perlu memilih mode lagi di dalam form. Jika ingin mengganti mode, gunakan tombol kembali ke halaman depan.",
                "Di dalam Home, pilih kategori pasien: bayi, balita, anak/remaja, dewasa, lansia, ibu hamil, atau ibu menyusui.",
                "Isi data dasar sesuai kategori pasien. Form akan menyesuaikan otomatis, misalnya bayi memakai usia bulan dan lingkar kepala, sedangkan ibu hamil memakai trimester dan usia kehamilan.",
                "Tanggal lahir dapat dipilih melalui kalender pada versi web, lalu umur akan dihitung otomatis. Pada bayi dan balita umur akan ditampilkan dalam bulan, sedangkan pada kelompok lain dalam tahun.",
                "Tekan Analisis Status Gizi untuk melihat ringkasan klinis, parameter antropometri, risk flags, rencana monitoring, dan target nutrisi otomatis.",
                "Pada pasien anak, aplikasi dapat menampilkan growth chart otomatis berbasis tabel referensi WHO yang tersedia di sistem.",
                "Hasil analisis juga dapat menampilkan SOAP klinis ringkas dan kode ICD-10 pendamping sebagai bahan dokumentasi awal.",
                "Target nutrisi seperti kalori, protein, karbohidrat, lemak, natrium, dan cairan akan terisi otomatis di awal sesuai kondisi individu, namun masih bisa diubah manual bila dibutuhkan.",
                "Setelah analisis selesai, data kondisi medis dan target nutrisi akan ikut dibawa otomatis ke tab Track, Label, dan Recipe sebagai nilai awal, tetapi tetap bisa diedit manual.",
                "Pada tab Recipe, pengguna dapat mengetik bahan utama seperti tempe atau ayam, lalu aplikasi menampilkan contoh resep yang disesuaikan dengan kondisi medis, kelompok pasien, dan target energi.",
                "Setiap bahan di menu Recipe sekarang ditampilkan dalam gram sekaligus padanan URT Indonesia seperti sdm, sdt, gelas belimbing, centong, mangkuk, potong, dan buah agar lebih mudah digunakan di rumah.",
                "Aplikasi juga menampilkan label sumber referensi edukasi gizi pada recipe screen untuk menjelaskan bahwa URT dipakai sebagai padanan praktis, sedangkan gram tetap menjadi acuan utama.",
                "Ringkasan recipe dapat dibagikan melalui WhatsApp atau Email, serta diunduh atau dibuka sebagai PDF untuk disimpan dan dicetak kembali.",
                "Pada tab Track, pengguna dapat mencatat makanan harian dengan format sederhana seperti nasi putih + tempe + telur untuk melihat total asupan dan persentasenya terhadap target.",
                "Analisis label gizi produk sekarang dipisahkan ke tab Label agar lebih fokus dan tidak menumpuk dengan tracking harian.",
                "Pada tab Label, pengguna dapat membuka galeri atau kamera, lalu melihat preview gambar label produk secara langsung di layar.",
                "Crop area sekarang dilakukan langsung di atas foto seperti editor galeri HP, sehingga pengguna tidak perlu lagi mengisi angka persen manual.",
                "Pengguna juga tetap bisa mengoreksi manual energi, karbohidrat, gula, natrium, lemak jenuh, protein, serat, dan takaran saji sebelum analisis dilakukan.",
                "Menu Label kini memakai satu tombol utama yang akan men-scan foto lalu menganalisis otomatis bila foto tersedia, atau langsung menganalisis data yang sudah diisi bila pengguna melakukan koreksi manual.",
                "Pada perangkat yang mendukung, sistem mencoba membaca teks label dari foto secara lebih otomatis, lalu mengisi kolom energi, karbohidrat, gula, natrium, lemak jenuh, protein, serat, dan takaran saji semaksimal mungkin.",
                "Untuk meningkatkan akurasi, sistem akan mencoba beberapa area crop kandidat dan versi gambar yang diperbesar, lalu memilih hasil OCR yang paling mirip dengan format label gizi.",
                "Bila hasil OCR masih belum lengkap, pengguna dapat memperbaiki angka secara manual lalu menekan tombol yang sama untuk analisis ulang.",
                "Hasil analisis produk akan ikut terbawa ke menu Recipe agar rekomendasi resep menjadi lebih otomatis menyesuaikan produk terakhir yang dinilai.",
                "Gunakan tab Profile untuk membuka panduan PDF, membagikannya, atau mencetaknya.",
                "Gunakan fitur ekspor untuk membuat dokumen PDF, DOC, CSV, atau Excel (.xlsx) sebagai catatan tracking pribadi atau dokumen pendamping petugas gizi/medis.",
                "Lihat target harian, catat makanan, gunakan rekomendasi resep, dan ikuti jadwal harian.",
                "Petugas gizi dan tenaga kesehatan dapat memakai aplikasi ini sebagai alat bantu edukasi dan pendamping konseling.",
            ],
        ),
        (
            "13. Kelompok Pasien yang Didukung",
            [
                "Bayi: fokus pada berat badan, panjang badan, lingkar kepala, MUAC bila tersedia, serta interpretasi pertumbuhan berdasarkan WHO.",
                "Balita: fokus pada BB/U, TB/U, BB/TB atau BB/PB, IMT/U, MUAC, dan growth monitoring serial.",
                "Anak dan Remaja: fokus pada BB/U (hingga referensi yang tersedia), TB/U, IMT/U, dan monitoring gizi tumbuh kembang.",
                "Dewasa dan Lansia: fokus pada IMT, lingkar perut, LILA, riwayat penurunan berat badan, kebutuhan energi, dan risiko metabolik.",
                "Ibu Hamil: fokus pada IMT, LILA, kenaikan berat badan selama kehamilan, trimester, dan kebutuhan nutrisi tambahan.",
                "Ibu Menyusui: fokus pada status gizi ibu, hidrasi, dukungan menyusui, dan kebutuhan energi serta protein tambahan.",
            ],
        ),
        (
            "14. Multi-Kondisi dan Keselamatan",
            [
                "Pada kondisi multi-penyakit, sistem memprioritaskan keselamatan klinis. Misalnya pada DM + HT + CKD Stage 2, protein disesuaikan terlebih dahulu untuk ginjal, karbohidrat tetap dikontrol, natrium dibatasi, dan lemak dipilih dari sumber yang lebih sehat.",
                "Aplikasi juga menampilkan aturan diet penyakit yang lebih detail, misalnya protein per stage CKD, karbohidrat terkontrol untuk DM, natrium rendah untuk hipertensi, lemak sehat untuk dislipidemia, dan pembatasan purin untuk gout/asam urat.",
                "NutriCore AI adalah alat bantu edukasi dan pendamping keputusan, bukan pengganti konsultasi langsung.",
            ],
        ),
        (
            "15. Output Klinis dan Tracking",
            [
                "Hasil analisis menampilkan interpretasi otomatis yang lebih bernilai klinis, bukan hanya angka.",
                "Untuk anak, growth chart otomatis membantu melihat posisi hasil ukur terhadap band referensi WHO.",
                "Untuk kebutuhan dokumentasi, aplikasi dapat menampilkan SOAP klinis ringkas dan ICD-10 pendamping.",
                "Target nutrisi bisa langsung dipakai untuk edukasi, lalu dikoreksi manual sesuai kondisi klinis, hasil laboratorium, atau kebijakan fasilitas.",
                "Pada recipe screen, ukuran rumah tangga praktis dipakai untuk membantu edukasi porsi, misalnya sdm, sdt, gelas belimbing, centong, dan mangkuk.",
                "Analisis label gizi produk memakai reminder warna: hijau bila relatif sesuai, kuning bila perlu hati-hati dengan takaran tertentu, dan merah bila tidak direkomendasikan. Alasan penilaian ditampilkan langsung agar mudah dipahami semua kalangan.",
                "Komponen label yang dipantau mencakup energi, karbohidrat, gula, natrium, lemak jenuh, protein, dan serat per saji.",
                "Hasil penilaian produk tersebut juga dipakai sebagai konteks tambahan saat sistem menyusun rekomendasi recipe agar saran menu lebih relevan untuk kondisi pasien dan pilihan produk terakhir.",
                "Dokumen ekspor bisa dijadikan catatan tracking pribadi, bahan konseling gizi, atau ringkasan pendamping petugas medis, termasuk SOAP, ICD-10 pendamping, dan profil laporan klinis.",
                "Pada Mode Profesional, dokumen ekspor dapat memuat nama dan alamat instansi, nomor rekam medis, nomor kunjungan, alamat pasien, jenis pembayaran atau penjamin, NIK, nomor BPJS, rujukan atau konsulan, serta tanda tangan petugas gizi dan petugas medis.",
                "Pada Mode Pribadi, dokumen dibuat lebih ringkas dan mengutamakan kebutuhan tracking personal, tanpa menampilkan field institusi resmi seperti nomor rekam medis.",
                "Format Excel multi-sheet memudahkan pencatatan Overview, Nutrition Targets, Recommendations, dan Clinical Notes.",
                "Recipe kini membaca status hasil analisis label produk secara lebih otomatis: status merah membuat rekomendasi lebih tegas menghindari produk tersebut, status kuning memberi batas takaran yang lebih ketat, dan status hijau memberi saran pemakaian yang tetap aman serta terukur.",
            ],
        ),
        (
            "16. Akses, Berbagi, dan Cetak PDF",
            [
                "Panduan ini tersedia pada menu Profile atau Help Center di aplikasi.",
                "Pengguna dapat menekan tombol Lihat PDF untuk membuka panduan langsung di browser atau viewer PDF.",
                "Tombol Bagikan dapat dipakai untuk berbagi ke WhatsApp, Email, dan saluran lain.",
                "Tombol Cetak dapat digunakan setelah PDF terbuka di viewer perangkat.",
                "Saat mengekspor PDF ringkasan hasil, logo NutriCore AI akan ikut dicantumkan pada dokumen.",
                "Pada Mode Profesional, PDF juga menampilkan kop surat sederhana berbasis nama dan alamat instansi agar lebih siap digunakan sebagai dokumen pendamping resmi.",
            ],
        ),
        (
            "17. Batasan Produksi Saat Ini",
            [
                "Versi web saat ini sudah dapat dipakai kerja dengan alur utama Home, Track, Label, Recipe, Profile, panduan PDF, dan ekspor dokumen.",
                "Frontend sudah online di Vercel, sedangkan backend saat ini masih memakai tunnel ngrok ke laptop lokal. Artinya backend hanya aktif selama laptop menyala, backend FastAPI berjalan, dan sesi ngrok belum tertutup.",
                "Bila terminal backend atau terminal ngrok ditutup, fitur analisis, recipe, label, tracking, dan ekspor online akan berhenti merespons sampai dijalankan kembali.",
                "OCR scan label dari foto saat ini paling stabil pada pemakaian lokal/web dari macOS, karena engine OCR backend masih bergantung pada komponen sistem macOS. Untuk server cloud Linux, OCR foto label masih perlu diganti ke engine yang kompatibel server.",
                "Karena backend belum berada di server publik permanen, URL backend dari ngrok dapat berubah setiap kali sesi ngrok dibuka ulang. Bila URL berubah, environment variable frontend perlu diperbarui lagi.",
                "Karena itu, untuk produksi penuh 24 jam dan multi-pengguna, langkah berikut yang paling penting adalah memindahkan backend ke hosting permanen dan mengganti OCR ke solusi server-side.",
            ],
        ),
        (
            "18. Referensi yang Digunakan",
            [
                "WHO Child Growth Standards 2006 untuk penilaian 0–5 tahun: berat menurut umur, panjang/tinggi menurut umur, berat menurut panjang/tinggi, IMT menurut umur, dan lingkar kepala menurut umur.",
                "WHO Growth Reference 2007 untuk 5–19 tahun: IMT menurut umur, tinggi menurut umur, dan berat menurut umur pada rentang referensi yang tersedia.",
                "WHO Fact Sheet: Obesity and Overweight, pembaruan 8 Desember 2025.",
                "WHO breastfeeding guidance: ASI eksklusif 6 bulan, dilanjutkan sampai 2 tahun atau lebih dengan MPASI sesuai usia.",
                "WHO antenatal care guidance untuk pemantauan kehamilan dan pengalaman kehamilan yang positif.",
                "Kemenkes/BKPK Indonesia: LILA < 23,5 cm pada ibu hamil sebagai indikator risiko KEK.",
                "Permenkes dan praktik administrasi fasilitas kesehatan di Indonesia dijadikan dasar struktur data resmi seperti identitas pasien, kunjungan, penjamin, dan dokumentasi pendamping, namun penyesuaian akhir tetap mengikuti kebijakan institusi masing-masing.",
                "Pendekatan skrining penyakit metabolik dan diet penyakit di aplikasi memakai prinsip praktik klinis umum untuk CKD, DM, hipertensi, dislipidemia, dan gout sebagai panduan awal edukatif.",
                "Pendekatan target nutrisi otomatis di aplikasi dipakai sebagai estimasi awal berbasis kelompok pasien, kondisi klinis, dan praktik skrining, lalu tetap harus dikonfirmasi secara profesional bila digunakan untuk keputusan klinis penuh.",
            ],
        ),
        (
            "19. Penutup",
            [
                "NutriCore AI dibangun dengan keyakinan bahwa kesehatan tidak harus rumit. Yang dibutuhkan adalah sistem yang mampu memahami kompleksitas tubuh manusia, lalu menyederhanakannya menjadi langkah yang bisa dijalani setiap hari.",
                "Dengan menggabungkan nutrisi, teknologi, dan pendekatan humanis, NutriCore AI hadir sebagai jembatan antara ilmu kesehatan dan kehidupan nyata.",
            ],
        ),
    ]

    for index, (title, items) in enumerate(sections):
        story.append(Paragraph(title, styles["Section"]))
        for item in items:
            story.append(bullet(item, styles))
        story.append(Spacer(1, 6))
        if index in {2, 6, 10}:
            story.append(PageBreak())

    story.append(PageBreak())
    story.append(Paragraph("Lampiran A. Visual Step-by-Step Penggunaan Aplikasi", styles["Section"]))
    story.append(
        Paragraph(
            "Lampiran ini memberikan gambaran visual modern seperti alur layar aplikasi agar pengguna umum, pasien, petugas gizi, dan tenaga kesehatan lebih mudah mengikuti langkah penggunaan NutriCore AI.",
            styles["BodyCustom"],
        )
    )
    story.append(Spacer(1, 6))

    visual_steps = [
        (
            1,
            "Halaman Depan Welcome",
            "Aplikasi sekarang dibuka dari layar depan khusus yang lebih modern dan fokus pada pemilihan alur penggunaan.",
            "#2FB34A",
            [
                "Menu bawah tidak ditampilkan pada layar ini agar tidak terjadi pendobelan navigasi.",
                "Pengguna dapat memilih Mulai Mode Pribadi, Masuk Mode Profesional, atau langsung membuka panduan.",
                "Halaman ini berfungsi sebagai pintu masuk utama sebelum masuk ke form Home.",
            ],
            ["Welcome screen", "Mode Pribadi", "Mode Profesional", "Lihat Panduan", "Tanpa menu bawah"],
        ),
        (
            2,
            "Isi Data Dasar di Home",
            "Setelah mode dipilih dari halaman depan, Home menampilkan form yang sesuai dengan mode tersebut.",
            "#1F4E94",
            [
                "Tersedia tombol kembali ke halaman depan bila pengguna ingin mengganti mode.",
                "Form akan berubah otomatis sesuai kategori pasien seperti bayi, dewasa, lansia, ibu hamil, atau ibu menyusui.",
                "Isi diagnosis, kondisi medis, tujuan, dan konteks klinis tambahan.",
                "Untuk ibu hamil tersedia trimester, usia kehamilan, dan BB pra-hamil.",
                "Untuk mode profesional tersedia No. rekam medis, penjamin, NIK, BPJS, dan rujukan.",
            ],
            ["Tombol kembali", "Data pasien", "Tanggal lahir", "Data institusi", "Rujukan / konsulan"],
        ),
        (
            3,
            "Analisis Status Gizi",
            "Tekan tombol Analisis Status Gizi untuk mendapatkan interpretasi otomatis dan target nutrisi awal.",
            "#0F9CB3",
            [
                "Aplikasi menampilkan ringkasan status gizi, risk flags, SOAP, ICD-10 pendamping, dan monitoring.",
                "Untuk anak akan muncul growth chart otomatis berbasis referensi WHO yang tersedia.",
                "Target kalori, protein, karbohidrat, lemak, natrium, dan cairan terisi otomatis.",
            ],
            ["Ringkasan status gizi", "Risk flags", "Growth chart", "SOAP", "Target nutrisi otomatis"],
        ),
        (
            4,
            "Pantau di Menu Track",
            "Data medis dan target gizi dari Home otomatis terbawa ke menu Track agar pencatatan makan lebih cepat.",
            "#F59E0B",
            [
                "Ketik makanan harian seperti nasi putih + tempe + telur.",
                "Lihat total asupan dan persentasenya terhadap target.",
                "Ikuti jadwal harian dan saran olahraga ringan sesuai tujuan awal.",
            ],
            ["Input makanan", "Total kalori", "Persentase target", "Jadwal makan", "Olahraga ringan"],
        ),
        (
            5,
            "Scan di Menu Label",
            "Menu Label menjadi tempat khusus untuk membaca foto label AKG dan menilai kecocokan produk dengan kondisi individu.",
            "#10B981",
            [
                "Pilih foto dari galeri atau buka kamera langsung dari layar Label.",
                "Preview gambar akan muncul di layar, lalu pengguna bisa menggeser kotak crop langsung di atas foto.",
                "Tombol utama akan menjalankan scan dan analisis otomatis dalam satu langkah, atau analisis ulang jika data sudah dikoreksi manual.",
                "Sistem membaca teks label, mengisi angka otomatis termasuk karbohidrat, lalu memberi status hijau, kuning, atau merah beserta alasan dan anjuran takaran.",
                "Di belakang layar, sistem mencoba beberapa crop dan pembesaran gambar agar label kecil atau sempit lebih mudah terbaca.",
            ],
            ["Galeri", "Kamera", "Crop box", "Scan utama", "Status warna"],
        ),
        (
            6,
            "Gunakan Menu Recipe",
            "Target nutrisi dan kondisi medis juga otomatis terbawa ke menu Recipe sebagai nilai awal.",
            "#8B5CF6",
            [
                "Pilih bahan utama seperti tempe, tahu, ayam, ikan, atau bahan lain.",
                "Lihat beberapa varian menu harian yang lebih variatif, termasuk buah dan pola makan seimbang.",
                "Setiap rencana dibagi menjadi sarapan, snack, makan siang, snack sore, dan makan malam.",
                "Jika hasil analisis label terakhir berstatus merah, recipe akan lebih tegas menghindari produk itu. Jika kuning, recipe akan membatasi takaran. Jika hijau, recipe akan memberi pemakaian yang lebih aman namun tetap terukur.",
            ],
            ["Bahan utama", "Kondisi medis", "Target kalori", "Varian menu", "Jadwal makan harian"],
        ),
        (
            7,
            "Ekspor & Bagikan Dokumen",
            "Setelah hasil sesuai, ekspor dokumen untuk arsip pribadi atau kebutuhan profesional.",
            "#EF4444",
            [
                "Export PDF, DOC, CSV, atau Excel sesuai kebutuhan.",
                "Mode Profesional menghasilkan format yang lebih formal dengan identitas institusi dan tanda tangan.",
                "Dokumen dapat dibuka, dicetak, atau dibagikan melalui WhatsApp dan Email.",
            ],
            ["Export PDF / DOC", "Excel multi-sheet", "Logo & kop surat", "Tanda tangan", "Bagikan / Cetak"],
        ),
    ]

    for step in visual_steps:
        story.append(build_visual_step_card(styles, *step))
        story.append(Spacer(1, 8))

    story.append(PageBreak())
    story.append(Paragraph("Lampiran B. Tabel URT Indonesia Praktis", styles["Section"]))
    story.append(
        Paragraph(
            "Lampiran ini memberi contoh padanan ukuran rumah tangga (URT) yang dipakai di menu Recipe sebagai panduan cepat. Nilai ini dipakai untuk edukasi praktis; gram tetap menjadi acuan utama bila tersedia alat ukur.",
            styles["BodyCustom"],
        )
    )
    urt_rows = [
        ["Bahan", "Padanan URT", "Acuan gram"],
        ["Nasi putih / nasi merah", "1 centong sedang", "100 g"],
        ["Susu rendah lemak", "1 gelas belimbing", "200 g/mL"],
        ["Oatmeal", "1 sdm", "10 g"],
        ["Minyak", "1 sdt", "5 g"],
        ["Sayur bening / sup sayur", "1 mangkuk sedang", "150-180 g"],
        ["Tempe / tahu", "1 potong sedang", "50 g"],
        ["Ayam", "1 potong kecil", "40 g"],
        ["Ikan", "1 potong sedang", "50 g"],
        ["Telur", "1 butir sedang", "55 g"],
        ["Buah potong / sayur cincang", "1 sdm", "15 g"],
        ["Roti", "1 lembar", "30 g"],
    ]
    urt_table = Table(urt_rows, colWidths=[60 * mm, 58 * mm, 42 * mm])
    urt_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF4F8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#102A6D")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEADING", (0, 0), (-1, -1), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE5EE")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(urt_table)

    story.append(PageBreak())
    story.append(Paragraph("Lampiran C. Checklist Final Siap Dipakai Kerja", styles["Section"]))
    story.append(
        Paragraph(
            "Checklist ini dibuat sederhana agar mudah dipakai setiap hari sebelum mulai bekerja menggunakan NutriCore AI.",
            styles["BodyCustom"],
        )
    )
    checklist_rows = [
        [
            Paragraph("Bagian", styles["TableHead"]),
            Paragraph("Sudah Aman", styles["TableHead"]),
            Paragraph("Perlu Perhatian", styles["TableHead"]),
        ],
        [
            Paragraph("Frontend web Vercel", styles["TableCell"]),
            Paragraph("Bisa dibuka online melalui link Vercel.", styles["TableCell"]),
            Paragraph("Perlu redeploy lagi setiap kali ada perubahan kode baru.", styles["TableCell"]),
        ],
        [
            Paragraph("Backend FastAPI", styles["TableCell"]),
            Paragraph("Berjalan lokal di laptop dan sudah bisa terhubung ke web melalui ngrok.", styles["TableCell"]),
            Paragraph("Belum 24 jam permanen; berhenti jika terminal backend atau ngrok ditutup.", styles["TableCell"]),
        ],
        [
            Paragraph("Home / Analisis Status Gizi", styles["TableCell"]),
            Paragraph("Sudah menghasilkan ringkasan, target nutrisi, dan sinkronisasi ke menu lain.", styles["TableCell"]),
            Paragraph("Tetap perlu uji cepat setelah URL ngrok berubah.", styles["TableCell"]),
        ],
        [
            Paragraph("Track", styles["TableCell"]),
            Paragraph("Sudah bisa dipakai mencatat asupan harian.", styles["TableCell"]),
            Paragraph("Perlu cek ulang bila target nutrisi dari Home baru saja diperbarui.", styles["TableCell"]),
        ],
        [
            Paragraph("Label", styles["TableCell"]),
            Paragraph("Analisis manual dan sinkronisasi ke Recipe sudah bekerja lebih baik.", styles["TableCell"]),
            Paragraph("OCR foto label masih paling stabil pada pemakaian lokal macOS dan belum ideal untuk server cloud.", styles["TableCell"]),
        ],
        [
            Paragraph("Recipe", styles["TableCell"]),
            Paragraph("Sudah membaca hasil label lebih otomatis dan menyesuaikan status merah, kuning, dan hijau.", styles["TableCell"]),
            Paragraph("Masih perlu evaluasi berkala bila ingin perilaku produk kemasan makin presisi.", styles["TableCell"]),
        ],
        [
            Paragraph("Panduan PDF", styles["TableCell"]),
            Paragraph("Sudah tersedia, bisa dibuka, dibagikan, dan dicetak.", styles["TableCell"]),
            Paragraph("Perlu digenerate ulang bila ada update fitur besar berikutnya.", styles["TableCell"]),
        ],
        [
            Paragraph("Dokumen ekspor", styles["TableCell"]),
            Paragraph("PDF, DOC, CSV, dan XLSX sudah siap dipakai sebagai catatan pribadi atau profesional.", styles["TableCell"]),
            Paragraph("Perlu review akhir bila dipakai sebagai dokumen resmi institusi.", styles["TableCell"]),
        ],
    ]
    checklist_table = Table(checklist_rows, colWidths=[36 * mm, 59 * mm, 73 * mm])
    checklist_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF4F8")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DCE5EE")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(checklist_table)
    story.append(Spacer(1, 10))
    for item in [
        "Sebelum mulai kerja, pastikan tiga hal hidup: backend FastAPI, tunnel ngrok, dan frontend web terbaru di Vercel.",
        "Bila menu analisis tiba-tiba tidak merespons, cek dulu apakah URL ngrok masih aktif dan belum berubah.",
        "Untuk penggunaan profesional yang lebih stabil, target berikutnya adalah memindahkan backend ke hosting permanen dan mengganti OCR label ke engine server-side.",
    ]:
        story.append(bullet(item, styles))

    return story


def main():
    doc = SimpleDocTemplate(
        str(OUTPUT_PATH),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Panduan Lengkap NutriCore AI",
        author="dr Theresia AYH",
    )
    doc.build(build_story(), onFirstPage=add_footer, onLaterPages=add_footer)
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
