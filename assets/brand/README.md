# demo-agent 品牌素材

本轮替换了偏离原图的 SVG。唯一几何参考为用户原始图 6（original-icon-dark.png），按原始 1254 × 1254 坐标手工描摹球体与三层卡片。不是像素级自动描摹；暖光渐变也是近似表现，不复刻原图纹理。

- mark-dark.svg / mark-light.svg：透明单色标志，保留三层。遮挡边界增加 7 个原图坐标单位的透明分隔，以便同色下看清层次。
- mark-small-dark.svg / mark-small-light.svg：与标准版相同的三层路径，不再减层。16 px 的层间辨识有限。
- icon-dark.svg / icon-light.svg：原图比例的矢量渐变图标，已收紧外围留白。
- favicon.svg：深色底，完整三层。
- lockup-dark.svg / lockup-light.svg：修正符号的横排组合。文字仍为可编辑文本，依赖系统字体回退，尚未转轮廓。
- contour-overlay.svg：原始图与青绿色矢量轮廓叠加，含被上层遮挡的路径，供检查比例。
- original-icon-dark.png / original-banner.png：原始图 6 / 图 1 的未修改副本。
- preview.html：原图、轮廓叠加、深浅版、小尺寸对照。
