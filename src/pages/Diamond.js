import DiamondsOnRays from "../components/DiamondsOnRays.tsx";


export default function Diamond() {
  return (

    <div className="holder">
      <DiamondsOnRays
        printIndex={true}
        rays={36}
        diamondsPerRay={0}
        startRadius={0}
        spacing={0}
        diamondWidth={24}
        diamondHeight={48}
        rotationSpeed={-0.4}
        spaghettiFactorWidth={10.0}
        spaghettiFactorHeight={1.0}
        spaghettiFactorSpacing={1.0}
        maxStretch={250}
        minWidth={1}
        inwardSpeed={80}
        mirrorCurveX={0.15}
        mirrorCurveY={0.015}
        mirrorBarrel={0.015}
        mirrorSegments={16}
        gapX={2}
        gapY={2}
        phaseShift={0.1}
        splitAngle={Math.PI / -5}
        color={"#000"}
        background={"#fff"}
        rotation={"radial"}
        decayMode={"linear"}
      />

      {/*<RadialTriangles*/}
      {/*  count={50}*/}
      {/*  innerRadius={0}*/}
      {/*  outerRadius={1320}*/}
      {/*  wedgeAngle={10}*/}
      {/*  angleOffset={-90}*/}
      {/*  fill={["#000", "#fff"]}*/}
      {/*  stroke={"#fff"}*/}
      {/*  lineWidth={0}*/}
      {/*  twistFactor={20}*/}
      {/*  background={"#fff"}*/}
      {/*  animate={true}*/}
      {/*  rotationSpeedDeg={-2}*/}
      {/*  rhombusHeight={20}*/}
      {/*  rhombusWidth={40}*/}
      {/*  rhombusFill="#555"*/}
      {/*/>*/}

      {/*<AbstractSpiralSVG*/}
      {/*  width={640}*/}
      {/*  height={640}*/}
      {/*  arms={28}*/}
      {/*  strokeWidth={8}*/}
      {/*  turns={7}*/}
      {/*  growth={0.18}*/}
      {/*  wobbleAmp={12}*/}
      {/*  wobbleFreq={2.5}*/}
      {/*  rotate*/}
      {/*  rotationSpeed={24}*/}
      {/*  bg="#fff"*/}
      {/*  fgBlack="#000"*/}
      {/*  fgWhite="#fff"*/}
      {/*  description="Abstract Spiral Series, Abstract Rotating Shape Vector, Black and White Shape Distort in Concentric, Irregular geometric elements, Vector Illustration"*/}
      {/*/>*/}

      {/* High-contrast, denser look */}
      {/*<AbstractSpiralSVG*/}
      {/*  width={640}*/}
      {/*  height={640}*/}
      {/*  arms={40}*/}
      {/*  strokeWidth={6}*/}
      {/*  turns={8}*/}
      {/*  growth={0.14}*/}
      {/*  wobbleAmp={16}*/}
      {/*  wobbleFreq={4}*/}
      {/*  rotate={false}*/}
      {/*  bg="#000"*/}
      {/*  fgBlack="#000"*/}
      {/*  fgWhite="#fff"*/}
      {/*/>*/}

      {/*<CheckerboardCanvas/>*/}

      {/*<KitaokaPseudoSpiral*/}
      {/*  bg="#000"*/}
      {/*  space="#000"*/}
      {/*  rings={24}*/}
      {/*  segments={10}*/}
      {/*  ringThickness={20}*/}
      {/*  gap={20}*/}
      {/*  tilt={45}*/}
      {/*  contrast={1}*/}
      {/*  rotationSpeed={-0.005}*/}
      {/*  tiltAmplitude={0}*/}
      {/*  pullSpeed={0}*/}
      {/*  zoom={2}*/}
      {/*  shape="rect"   // варианты: rect | diamond | ellipse*/}
      {/*/>*/}

      {/*<FraserSpiralAnimated*/}
      {/*  bg="#000"*/}
      {/*  space="#000"*/}
      {/*  gapX={0}*/}
      {/*  gapY={0}*/}
      {/*  phaseOffset={Math.PI / 4}*/}
      {/*  zoom={2}*/}
      {/*  rings={30}*/}
      {/*  segments={40}*/}
      {/*  ringThickness={30}*/}
      {/*  gap={20}*/}
      {/*  tilt={45}*/}
      {/*  contrast={1}*/}
      {/*  rotationSpeed={-0.05}*/}
      {/*  tiltAmplitude={0}*/}
      {/*  pullSpeed={0}*/}
      {/*/>*/}

      {/*<FraserSpiral*/}
      {/*  width={700}*/}
      {/*  height={700}*/}
      {/*  rings={22}*/}
      {/*  segments={72}*/}
      {/*  ringThickness={12}*/}
      {/*  gap={8}*/}
      {/*  tilt={16}*/}
      {/*  contrast={0.95}*/}
      {/*  bg="#000fff"*/}
      {/*/>*/}
    </div>
  )
}
