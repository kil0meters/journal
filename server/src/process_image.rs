use std::sync::Once;

use magick_rust::{magick_wand_genesis, ColorspaceType, MagickWand};

static START: Once = Once::new();

// convert image to moderate quality AVIF file
pub fn convert_image(buf: &[u8]) {
    START.call_once(|| {
        magick_wand_genesis();
    });

    let mut wand = MagickWand::new();
    wand.read_image("test_images/_DSC1484.ARW").unwrap();
    // wand.set_image_format("arw").unwrap();
    wand.set_image_depth(10).unwrap();
    wand.set_compression_quality(70).unwrap();
    let colorspace = wand.get_colorspace();
    println!("input colorpsace: {colorspace:?}");

    wand.transform_image_colorspace(ColorspaceType::DisplayP3)
        .unwrap();
    wand.set_image_colorspace(ColorspaceType::DisplayP3)
        .unwrap();

    if wand.get_image_width() > 8000 || wand.get_image_height() > 8000 {
        wand.fit(8000, 8000);
    }

    // pretty generous quality
    wand.write_image(&format!("output.avif")).unwrap();
}
