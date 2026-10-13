import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const circumference = 2 * Math.PI * 37;

const macros = [
  {
    label: "Protein",
    value: "68 / 120 g",
    color: "bg-primary",
    width: "w-[57%]",
  },
  {
    label: "Carbs",
    value: "140 / 220 g",
    color: "bg-[#78C9AA]",
    width: "w-[64%]",
  },
  {
    label: "Fat",
    value: "38 / 65 g",
    color: "bg-[#F4C96A]",
    width: "w-[58%]",
  },
];

export function NutritionSummary() {
  return (
    <View className="flex-row items-center gap-[16px] bg-surface rounded-[24px] p-[16px] mb-[20px]">
      <View className="relative w-[88px] h-[88px]">
        <Svg width={88} height={88} viewBox="0 0 88 88">
          <Circle
            cx={44}
            cy={44}
            r={37}
            fill="none"
            stroke="#E3F0EB"
            strokeWidth={8}
          />

          <Circle
            cx={44}
            cy={44}
            r={37}
            fill="none"
            stroke="#0C7762"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.62} ${circumference}`}
            rotation={-90}
            origin="44, 44"
          />
        </Svg>

        <View className="absolute inset-0 items-center justify-center">
          <Text className="font-poppins-bold text-text text-[20px]">
            1,240
          </Text>
          <Text className="font-poppins text-muted text-[8px]">
            of 2,000 kcal
          </Text>
        </View>
      </View>

      <View className="flex-1 gap-[12px]">
        {macros.map((macro) => (
          <View key={macro.label}>
            <View className="flex-row justify-between mb-[4px]">
              <Text className="font-poppins text-text text-[10px]">
                {macro.label}
              </Text>
              <Text className="font-poppins text-muted text-[10px]">
                {macro.value}
              </Text>
            </View>

            <View className="h-[5px] bg-[#E5F1ED] rounded-full overflow-hidden">
              <View
                className={`h-full rounded-full ${macro.color} ${macro.width}`}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}