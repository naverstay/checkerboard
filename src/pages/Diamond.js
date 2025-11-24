import DiamondsOnRays from "../components/DiamondsOnRays.tsx";

export default function Diamond() {
  return (

    <div className="holder">
      <DiamondsOnRays
        printIndex={false}
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
        color={"#fff"}
        background={"#000"}
        rotation={"radial"}
        decayMode={"exponential"}
      />
    </div>
  )
}
