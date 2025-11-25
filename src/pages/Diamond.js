import FanBlades from "../components/FanBlades.tsx";

export default function Diamond() {
  return (

    <div className="holder">
      <FanBlades
        printIndex={false}
        rays={72}
        diamondsPerRay={0}
        startRadius={0}
        spacing={0}
        diamondWidth={24}
        diamondHeight={48}
        rotationSpeed={-0.2}
        phaseShift={Math.PI / 2.77}
        spaghettiFactorWidth={10.0}
        spaghettiFactorHeight={1.0}
        spaghettiFactorSpacing={1.0}
        maxStretch={250}
        minWidth={1}
        distancingStep={0.5}
        inwardSpeed={80}
        teleportLimit={8}
        gapX={20}
        gapY={-20}
        mirrorCurveX={0.5}
        mirrorCurveY={0.25}
        mirrorBarrel={0.5}
        mirrorSegments={24}
        splitAngle={Math.PI / 5}
        color={"#fff"}
        background={"#000"}
        rotation={"radial"}
        decayMode={"exponential"}
      />
    </div>
  )
}
