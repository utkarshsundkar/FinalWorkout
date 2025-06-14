import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  Platform,
  TextInput,
} from 'react-native';
import {
  configure,
  startAssessment,
  startCustomAssessment,
  setSessionLanguage,
  startCustomWorkout,
  startWorkoutProgram,
  setEndExercisePreferences,
  setCounterPreferences,
} from '@sency/react-native-smkit-ui';
import * as SMWorkoutLibrary from '@sency/react-native-smkit-ui/src/SMWorkout';
import EditText from './components/EditText';
import ThreeCheckboxes from './components/ThreeCheckboxes';
import React from 'react';
import PlanSection from './components/PlanSection';

const SCREEN_WIDTH = Dimensions.get('window').width;

const App = () => {
  const [didConfig, setDidConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWFPUI, setWPFUI] = useState(false);
  const [week, setWeek] = useState('1');
  const [bodyZone, setBodyZone] = useState(SMWorkoutLibrary.BodyZone.FullBody);
  const [difficulty, setDifficulty] = useState(SMWorkoutLibrary.WorkoutDifficulty.LowDifficulty);
  const [duration, setDuration] = useState(SMWorkoutLibrary.WorkoutDuration.Long);
  const [language, setLanguage] = useState(SMWorkoutLibrary.Language.English);
  const [name, setName] = useState('YOUR_PROGRAM_ID');
  const [modalVisible, setModalVisible] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');
  const [parsedSummaryData, setParsedSummaryData] = useState<any>(null);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [creditScore, setCreditScore] = useState(0);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<{ strengths: string[], improvements: string[] }>({ strengths: [], improvements: [] });
  const [isNightMode, setIsNightMode] = useState(false);

  // New state variables for the assessment info modal
  const [assessmentInfoModalVisible, setAssessmentInfoModalVisible] = useState(false);
  const [currentAssessmentExercises, setCurrentAssessmentExercises] = useState<any[]>([]);
  const [currentAssessmentType, setCurrentAssessmentType] = useState<string | null>(null); // To store the category type
  const [hasRestarted, setHasRestarted] = useState(false);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [startDisabled, setStartDisabled] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [showBodyPartsModal, setShowBodyPartsModal] = useState(false);
  const [bodyPartsSearch, setBodyPartsSearch] = useState('');
  const bodyParts = [
    { label: 'Shoulders', image: require('./assets/Shoulder.png') },
    { label: 'Chest', image: require('./assets/Chest.png') },
    { label: 'Thighs', image: require('./assets/Thighs.png') },
    { label: 'Hips & Glutes', image: require('./assets/Hips.png') },
    { label: 'Calves', image: require('./assets/Calves.png') },
    { label: 'Arms', image: require('./assets/Chest.png') },
    { label: 'Abs', image: require('./assets/Chest.png') },
    { label: 'Oblique', image: require('./assets/Chest.png') },
    { label: 'Lower Back', image: require('./assets/Chest.png') },
    // Add more as needed
  ];
  const filteredBodyParts = bodyParts.filter(bp => bp.label.toLowerCase().includes(bodyPartsSearch.toLowerCase()));

  // Add level durations mapping
  const levelDurations = {
    beginner: 30,
    performer: 60,
    advanced: 120
  };

  // Plan exercise data (example)
  const planData = [
    {
      id: 1,
      name: 'Shoulders',
      level: 'All Levels',
      time: '30-45 min',
      focus: 'Full Body',
      image: require('./assets/Trial.png'),
      exercises: [
        {
          name: 'Shoulder Taps Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Shoulder.png'),
        },
        {
          name: 'Shoulder Press',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Shoulder.png'),
        },
        {
          name: 'Overhead Squat',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Shoulder.png'),
        },
        {
          name: 'Reverse Sit to Table Top',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Shoulder.png'),
        },
      ]
    },
    {
      id: 2,
      name: 'Chest',
      level: 'All Levels',
      time: '20-30 min',
      focus: 'Chest',
      image: require('./assets/Chest.png'),
      exercises: [
        {
          name: 'Push-ups',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Shoulder Taps Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'High Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
      ]
    },
    {
      id: 'plank-core-stability',
      name: 'Plank & Core Stability',
      level: 'Beginner',
      time: '4 min',
      focus: 'Core',
      image: require('./assets/plankM.png'),
      exercises: [
        {
          name: 'High Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/plankM.png')
        },
        {
          name: 'Side Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/plankM.png')
        },
        {
          name: 'Tuck Hold',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/plankM.png')
        },
        {
          name: 'Plank',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/plankM.png')
        }
      ]
    },
    {
      id: 'mobility-stretch',
      name: 'Mobility & Stretch',
      level: 'Beginner',
      time: '5 min',
      focus: 'Mobility',
      image: require('./assets/MobileM.png'),
      exercises: [
        {
          name: 'Hamstring mobility',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/MobileM.png')
        },
        {
          name: 'Standing hamstring mobility',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/MobileM.png')
        },
        {
          name: 'Side bend',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/MobileM.png')
        },
        {
          name: 'Standing knee raises',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/MobileM.png')
        },
        {
          name: 'Jefferson curl',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 10,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/MobileM.png')
        }
      ]
    },
    {
      id: 'cardio-basic',
      name: 'Cardio Basic',
      level: 'Beginner',
      time: '8 min',
      focus: 'Cardio',
      image: require('./assets/JumpingJacks.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'High Knees',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Ski Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Skater Hops',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        }
      ]
    },
    {
      id: 'cardio-hardcore',
      name: 'Cardio Hardcore',
      level: 'Advanced',
      time: '12 min',
      focus: 'Cardio',
      image: require('./assets/JumpingJacks.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'High Knees',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Ski Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Skater Hops',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Lunge',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 12,
            performer: 20,
            advanced: 30
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Jumps',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 15,
            performer: 25,
            advanced: 35
          },
          image: require('./assets/JumpingJacks.png')
        },
        {
          name: 'Standing Knee Raise',
          duration: {
            beginner: 30,
            performer: 60,
            advanced: 120
          },
          reps: {
            beginner: 20,
            performer: 30,
            advanced: 40
          },
          image: require('./assets/JumpingJacks.png')
        }
      ]
    },
    {
      id: 'thighs',
      name: 'Thighs',
      level: 'All Levels',
      time: '',
      focus: 'Thighs',
      image: require('./assets/Thighs.png'),
      exercises: [
        {
          name: 'Lunge',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Air Squat',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Overhead Squat',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Ski Jumps',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Jumps',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Standing Knee Raise Left',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Thighs.png'),
        },
        {
          name: 'Standing Knee Raise Right',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Thighs.png'),
        },
      ],
    },
    {
      id: 'hips-glutes',
      name: 'Hips & Glutes',
      level: 'All Levels',
      time: '',
      focus: 'Hips & Glutes',
      image: require('./assets/Hips.png'),
      exercises: [
        {
          name: 'Glutes Bridge',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Hips.png'),
        },
        {
          name: 'Skater Hops',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Hips.png'),
        },
        {
          name: 'Hamstring mobility',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Hips.png'),
        },
        {
          name: 'Standing hamstring mobility',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Hips.png'),
        },
      ],
    },
    {
      id: 'calves',
      name: 'Calves',
      level: 'All Levels',
      time: '',
      focus: 'Calves',
      image: require('./assets/Calves.png'),
      exercises: [
        {
          name: 'Jumping Jacks',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Calves.png'),
        },
        {
          name: 'High Knees',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Calves.png'),
        },
      ],
    },
    {
      id: 'arms',
      name: 'Arms',
      level: 'All Levels',
      time: '',
      focus: 'Arms',
      image: require('./assets/Chest.png'),
      exercises: [
        {
          name: 'Push-ups',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Shoulder Press',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Reverse Sit to Table Top',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
      ],
    },
    {
      id: 'abs',
      name: 'Abs',
      level: 'All Levels',
      time: '',
      focus: 'Abs',
      image: require('./assets/Chest.png'),
      exercises: [
        {
          name: 'Crunches',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Tuck Hold',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Shoulder Taps Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Push-ups',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Standing Knee Raise Left',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Standing Knee Raise Right',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 20, performer: 30, advanced: 40 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Jumping Jacks',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 15, performer: 25, advanced: 35 },
          image: require('./assets/Chest.png'),
        },
      ],
    },
    {
      id: 'lower-back',
      name: 'Lower Back',
      level: 'All Levels',
      time: '',
      focus: 'Lower Back',
      image: require('./assets/Chest.png'),
      exercises: [
        {
          name: 'Glutes Bridge',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Jefferson curl',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'High Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Side Plank',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Hamstring mobility',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Standing hamstring mobility',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 10, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
        {
          name: 'Reverse Sit to Table Top',
          duration: { beginner: 30, performer: 60, advanced: 120 },
          reps: { beginner: 12, performer: 20, advanced: 30 },
          image: require('./assets/Chest.png'),
        },
      ],
    },
  ];

  // Map display names to Sency detector IDs
  const exerciseIdMap = {
    'Push-ups': 'PushupRegular',
    'Squats': 'SquatRegular',
    'Plank': 'PlankHighStatic',
    'High Plank': 'PlankHighStatic',
    'Side Plank': 'PlankSideLowStatic',
    'Tuck Hold': 'TuckHold',
    'Hamstring mobility': 'StandingAlternateToeTouch',
    'Standing hamstring mobility': 'StandingAlternateToeTouch',
    'Side bend': 'StandingSideBendRight',
    'Side Bend Left': 'StandingSideBendLeft',
    'Side Bend Right': 'StandingSideBendRight',
    'Oblique Crunches': 'StandingObliqueCrunches',
    'Standing knee raises': 'HighKnees',
    'Jefferson curl': 'JeffersonCurlRight',
    'Jumping Jacks': 'JumpingJacks',
    'High Knees': 'HighKnees',
    'Ski Jumps': 'SkiJumps',
    'Skater Hops': 'SkaterHops',
    'Lunge': 'Lunge',
    'Jumps': 'Jumps',
    'Standing Knee Raise': 'StandingKneeRaiseLeft',
    'Standing Knee Raise Left': 'StandingKneeRaiseLeft',
    'Standing Knee Raise Right': 'StandingKneeRaiseRight',
    'Shoulder Taps Plank': 'PlankHighShoulderTaps',
    'Shoulder Press': 'ShouldersPress',
    'Overhead Squat': 'SquatRegularOverheadStatic',
    'Reverse Sit to Table Top': 'ReverseSitToTableTop',
    'Crunches': 'Crunches',
    'Glutes Bridge': 'GlutesBridge',
    'Air Squat': 'SquatRegular',
  };

  // Map display names to scoring type and UI
  const exerciseScoringMap = {
    'Push-ups': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Squats': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'High Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Plank': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Tuck Hold': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Hamstring mobility': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Standing hamstring mobility': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Side bend': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Bend Left': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Side Bend Right': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Oblique Crunches': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Standing knee raises': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Jefferson curl': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Jumping Jacks': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'High Knees': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Ski Jumps': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Skater Hops': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Lunge': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Jumps': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise Left': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Standing Knee Raise Right': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Shoulder Taps Plank': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Shoulder Press': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Overhead Squat': { type: SMWorkoutLibrary.ScoringType.Time, ui: [SMWorkoutLibrary.UIElement.Timer] },
    'Reverse Sit to Table Top': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Crunches': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Glutes Bridge': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
    'Air Squat': { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] },
  };

  // Add a new state for search results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Define the visible body parts on the main page
  const visibleBodyParts = ['Shoulders', 'Chest', 'Thighs', 'Hips & Glutes'];

  // Update the search handler to only search visible items
  const handleSearch = (text: string) => {
    setSearchText(text);
    setSearchPerformed(true);
    if (!text.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }
    const lowerText = text.toLowerCase();
    // Only search in visible body parts
    const bodyPartMatches = bodyParts.filter(bp => visibleBodyParts.includes(bp.label) && bp.label.toLowerCase().includes(lowerText));
    // Only search in plans for visible body parts
    const visiblePlanIds = visibleBodyParts.map(label => bodyPartToPlanId[label]);
    const planMatches = planData.filter(plan => visiblePlanIds.includes(plan.id) && plan.name.toLowerCase().includes(lowerText));
    // Only search in exercises within visible plans
    const exerciseMatches: any[] = [];
    planData.forEach(plan => {
      if (visiblePlanIds.includes(plan.id) && plan.exercises) {
        plan.exercises.forEach((ex: any) => {
          if (ex.name && ex.name.toLowerCase().includes(lowerText)) {
            exerciseMatches.push({ ...ex, planName: plan.name });
          }
        });
      }
    });
    // Combine results
    const results = [
      ...planMatches.map(plan => ({ type: 'plan', data: plan })),
      ...bodyPartMatches.map(bp => ({ type: 'bodyPart', data: bp })),
      ...exerciseMatches.map(ex => ({ type: 'exercise', data: ex })),
    ];
    setSearchResults(results);
  };

  useEffect(() => {
    configureSMKitUI();
  }, []);

  useEffect(() => {
    const didExitWorkoutSubscription = DeviceEventEmitter.addListener('didExitWorkout', params => {
      handleEvent(params.summary);
      console.log('Received didExitWorkout event with message:', params.summary);
    });

    const workoutDidFinishSubscription = DeviceEventEmitter.addListener('workoutDidFinish', params => {
      handleEvent(params.summary);
      console.log('Received workoutDidFinish event with message:', params.summary);
    });

    return () => {
      didExitWorkoutSubscription.remove();
      workoutDidFinishSubscription.remove();
    };
  }, []);

  const analyzePerformance = (data: any) => {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!data.exercises || data.exercises.length === 0) {
      return { strengths, improvements };
    }

    // Analyze each exercise
    data.exercises.forEach(exercise => {
      const exerciseName = exercise.pretty_name || exercise.exercise_id || 'Unknown Exercise';
      const score = exercise.total_score || 0;
      const repsPerfect = exercise.reps_performed_perfect || 0;
      const timePerfect = exercise.time_in_position_perfect || 0;

      // Example analysis logic (customize based on your scoring system and exercise types)
      if (score >= 8) { // High score threshold
        strengths.push(`${exerciseName}: Excellent performance with a score of ${score}.`);
      } else if (score <= 3) { // Low score threshold
        improvements.push(`${exerciseName}: Room for improvement. Current score: ${score}.`);
      }

      // Analyze reps and time if available
      if (repsPerfect > 0) {
        strengths.push(`${exerciseName}: Completed ${repsPerfect} perfect repetitions.`);
      }
      if (timePerfect > 0) {
        strengths.push(`${exerciseName}: Held correct position for ${timePerfect.toFixed(1)} seconds.`);
      }
    });

    return { strengths, improvements };
  };

  const handleEvent = async (summary) => {
    try {
      console.log('Event received:', summary);
    setSummaryMessage(summary);
      let parsed: any = null;
      try {
        parsed = JSON.parse(summary);
        setParsedSummaryData(parsed);
      } catch (e) {
        setParsedSummaryData(null);
      }
      setModalVisible(true);
    } catch (e) {
      console.error('Error handling event:', e);
      Alert.alert('Error', 'Failed to process assessment results.');
    }
  };

  const onDuration = (index) => {
    setDuration(index === 0 ? SMWorkoutLibrary.WorkoutDuration.Long : SMWorkoutLibrary.WorkoutDuration.Short);
  };

  const onLanguage = (index) => {
    setLanguage(index === 0 ? SMWorkoutLibrary.Language.Hebrew : SMWorkoutLibrary.Language.English);
  };

  const onBodyZone = (index) => {
    setBodyZone(
      index === 0 ? SMWorkoutLibrary.BodyZone.UpperBody :
      index === 1 ? SMWorkoutLibrary.BodyZone.LowerBody :
      SMWorkoutLibrary.BodyZone.FullBody
    );
  };

  const onDifficulty = (index) => {
    setDifficulty(
      index === 0 ? SMWorkoutLibrary.WorkoutDifficulty.LowDifficulty :
      index === 1 ? SMWorkoutLibrary.WorkoutDifficulty.MidDifficulty :
      SMWorkoutLibrary.WorkoutDifficulty.HighDifficulty
    );
  };

  const handleExerciseSelect = (exercise: string) => {
    setSelectedExercises(prev => {
      if (prev.includes(exercise)) {
        return prev.filter(e => e !== exercise);
      }
      if (prev.length >= 3) {
        showAlert('Maximum Exercises', 'You can only select up to 3 exercises');
        return prev;
      }
      return [...prev, exercise];
    });
  };

  const handleCategorySelect = async (category: string) => {
    if (!didConfig) {
      showAlert('Configuration Required', 'Please wait for configuration to complete.');
      return;
    }

    let exercisesToShow: any[] = [];
    let assessmentToStart: string | null = category;

    try {
      switch (category) {
        case 'Burn Calories Faster':
          const burnCaloriesPlans = planData.filter(plan => 
            plan.id === 'fat-burner' || 
            plan.id === 'hiit-workout' || 
            plan.id === 'plank-core-stability'
          );
          setSelectedPlan(burnCaloriesPlans[0]); // Show the first plan by default
          setShowPlanModal(true);
          break;
        // ... existing code ...
      }
      // ... existing code ...
    } catch (error) {
      console.error('Error preparing assessment:', error);
      Alert.alert('Error', 'Failed to prepare assessment. Please try again.');
    }
  };

  // New function to start the assessment from the info modal
  const startAssessmentFromInfoModal = async () => {
    setAssessmentInfoModalVisible(false); // Close the info modal
    setIsLoading(true); // Show loading indicator
    setHasRestarted(false); // Reset restart flag on manual start

    try {
      switch (currentAssessmentType) {
        case 'Fitness':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Fitness,
            true,
            ''
          );
          break;
        case 'Movement':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Body360,
            true,
            ''
          );
          break;
        case 'Cardio':
          await startAssessmentSession(
            SMWorkoutLibrary.AssessmentTypes.Fitness, // Using Fitness type for Cardio
            true,
            ''
          );
          break;
        case 'Strength':
           // Start the predefined strength assessment if you have a separate function for it,
           // or if it uses startCustomAssessment with the specific strength exercises.
           // For now, let's assume you might have a startStrengthAssessment function or
           // it uses startCustomAssessment with the defined strengthExercises.
           // Example using startCustomAssessment with the previously defined exercises:
           const strengthExercises = [
            new SMWorkoutLibrary.SMExercise(
              "Burpees",
              35,
              "BurpeesRegular",
              null,
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer],
              "BurpeesRegular",
              "",
              null
            ),
            new SMWorkoutLibrary.SMExercise(
              "Froggers",
              35,
              "FroggersRegular",
              null,
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer],
              "FroggersRegular",
              "",
              null
            )
          ];
           const strengthWorkout = new SMWorkoutLibrary.SMWorkout('strength', 'Strength Assessment', null, null, strengthExercises, null, null, null);
           await startCustomAssessment(strengthWorkout, null, true, false); // Assuming showSummary is false for these
          break;
        case 'Custom Fitness':
          await startSMKitUICustomAssessment();
          break;
        default:
          console.error('Unknown assessment type to start:', currentAssessmentType);
          Alert.alert('Start Error', 'Could not determine the assessment type to start.');
          break;
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      Alert.alert('Start Error', 'Failed to start assessment.');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  const handleStartWorkout = async () => {
    if (selectedExercises.length === 0) {
      showAlert('No Exercises', 'Please select at least one exercise');
      return;
    }

    try {
      const exercises = selectedExercises.map(exerciseName => {
        let detectorId;
        let scoringType;
        let targetReps: number | null = null;
        let targetTime: number | null = null;
        let uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];

        switch(exerciseName) {
          case 'High Plank':
            detectorId = 'PlankHighStatic';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Air Squat':
            detectorId = 'SquatRegular';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            break;
          case 'Push-ups':
            detectorId = 'PushupRegular';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            break;
          case 'OH Squat':
            detectorId = 'SquatRegularOverheadStatic';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 20;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Knee Raise Left':
            detectorId = 'StandingKneeRaiseLeft';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 15;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Knee Raise Right':
            detectorId = 'StandingKneeRaiseRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 15;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Side Bend Left':
            detectorId = 'StandingSideBendLeft';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Side Bend Right':
            detectorId = 'StandingSideBendRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 30;
            uiElements = [SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Standing Alternate Toe Touch':
            detectorId = 'StandingAlternateToeTouch';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Jefferson Curl':
            detectorId = 'JeffersonCurlRight';
            scoringType = SMWorkoutLibrary.ScoringType.Time;
            targetTime = 20;
            uiElements = [SMWorkoutLibrary.UIElement.GaugeOfMotion, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Alternate Windmill Toe Touch':
            detectorId = 'AlternateWindmillToeTouch';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'AlternateWindmillToeTouch',           // name
              35,                                     // totalSeconds
              'AlternateWindmillToeTouch',            // videoInstruction
              null,                                   // exerciseIntro
              uiElements,                             // UI elements
              'AlternateWindmillToeTouch',            // detector
              '',                                     // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,                          // scoring type based on exercise
                0.3,                                  // threshold
                targetTime,                           // targetTime (for plank and static holds)
                targetReps,                           // targetReps (for dynamic exercises)
                null,                                 // targetDistance
                null                                  // targetCalories
              ),
              '',                                     // failedSound
              exerciseName,                           // exerciseTitle (display name)
              'Complete the exercise',                 // subtitle
              'Reps',                                 // scoreTitle
              'clean reps'                            // scoreSubtitle
            );
          case 'Burpees':
            detectorId = 'Burpees';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Burpees',           // name
              35,                     // totalSeconds
              'Burpees',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'Burpees',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Crunches':
            detectorId = 'Crunches';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 15;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            break;
          case 'Froggers':
            detectorId = 'Froggers';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 10;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Froggers',           // name
              35,                     // totalSeconds
              'Froggers',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'Froggers',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Glute Bridge':
            detectorId = 'GlutesBridge';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'GlutesBridge',           // name
              35,                         // totalSeconds
              'GlutesBridge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'GlutesBridge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'High Knees':
            detectorId = 'HighKnees';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'HighKnees',           // name
              35,                     // totalSeconds
              'HighKnees',            // videoInstruction
              null,                  // exerciseIntro
              uiElements,            // UI elements
              'HighKnees',            // detector
              '',                    // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,         // scoring type based on exercise
                0.3,                 // threshold
                targetTime,          // targetTime (for plank and static holds)
                targetReps,          // targetReps (for dynamic exercises)
                null,                // targetDistance
                null                 // targetCalories
              ),
              '',                    // failedSound
              exerciseName,          // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',  // scoreTitle
              'clean reps'  // scoreSubtitle
            );
          case 'Jumping Jacks':
            detectorId = 'JumpingJacks';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'JumpingJacks',           // name
              35,                         // totalSeconds
              'JumpingJacks',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'JumpingJacks',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Jumps':
            detectorId = 'Jumps';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 15;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Jumps',           // name
              35,                         // totalSeconds
              'Jumps',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'Jumps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lateral Raises':
            detectorId = 'LateralRaise';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'LateralRaise',           // name
              35,                         // totalSeconds
              'LateralRaise',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'LateralRaise',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lunge':
            detectorId = 'Lunge';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'Lunge',           // name
              35,                         // totalSeconds
              'Lunge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'Lunge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Lunge Jump':
            detectorId = 'LungeJump';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'LungeJump',           // name
              35,                         // totalSeconds
              'LungeJump',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'LungeJump',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Side Lunge':
            detectorId = 'SideLunge';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 12;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SideLunge',           // name
              35,                         // totalSeconds
              'SideLunge',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'SideLunge',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Mountain Climber Plank':
            detectorId = 'MountainClimberPlank';
            scoringType = SMWorkoutLibrary.ScoringType.Reps;
            targetReps = 20;
            uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'MountainClimberPlank',           // name
              35,                         // totalSeconds
              'MountainClimberPlank',            // videoInstruction
              null,                      // exerciseIntro
              uiElements,                // UI elements
              'MountainClimberPlank',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                scoringType,             // scoring type based on exercise
                0.3,                     // threshold
                targetTime,              // targetTime (for plank and static holds)
                targetReps,              // targetReps (for dynamic exercises)
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle (display name)
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Shoulder Taps Plank':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'PlankHighShoulderTaps',           // name
              35,                         // totalSeconds
              'PlankHighShoulderTaps',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'PlankHighShoulderTaps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Reverse Sit to Table Top':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'ReverseSitToTableTop',           // name
              35,                         // totalSeconds
              'ReverseSitToTableTop',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'ReverseSitToTableTop',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Skater Hops':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SkaterHops',           // name
              35,                         // totalSeconds
              'SkaterHops',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SkaterHops',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Ski Jumps':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SkiJumps',           // name
              35,                         // totalSeconds
              'SkiJumps',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SkiJumps',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Rotation Jab Squat':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'SquatAndRotationJab',           // name
              35,                         // totalSeconds
              'SquatAndRotationJab',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'SquatAndRotationJab',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Bicycle Crunches':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'StandingBicycleCrunches',           // name
              35,                         // totalSeconds
              'StandingBicycleCrunches',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'StandingBicycleCrunches',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Oblique Crunches':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'StandingObliqueCrunches',           // name
              35,                         // totalSeconds
              'StandingObliqueCrunches',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'StandingObliqueCrunches',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                20,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Shoulder Press':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'ShouldersPress',           // name
              35,                         // totalSeconds
              'ShouldersPress',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer], // UI elements
              'ShouldersPress',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Reps,  // scoring type
                0.3,                     // threshold
                null,                    // targetTime
                12,                      // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Complete the exercise',   // subtitle
              'Reps',                    // scoreTitle
              'clean reps'               // scoreSubtitle
            );
          case 'Side Plank':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'PlankSideLowStatic',           // name
              35,                         // totalSeconds
              'PlankSideLowStatic',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.Timer], // UI elements
              'PlankSideLowStatic',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Time,  // scoring type
                0.3,                     // threshold
                30,                      // targetTime
                null,                    // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Hold the position',   // subtitle
              'Time',                    // scoreTitle
              'seconds'               // scoreSubtitle
            );
          case 'Tuck Hold':
            return new SMWorkoutLibrary.SMAssessmentExercise(
              'TuckHold',           // name
              35,                         // totalSeconds
              'TuckHold',            // videoInstruction
              null,                      // exerciseIntro
              [SMWorkoutLibrary.UIElement.Timer], // UI elements
              'TuckHold',            // detector
              '',                        // successSound
              new SMWorkoutLibrary.SMScoringParams(
                SMWorkoutLibrary.ScoringType.Time,  // scoring type
                0.3,                     // threshold
                30,                      // targetTime
                null,                    // targetReps
                null,                    // targetDistance
                null                     // targetCalories
              ),
              '',                        // failedSound
              exerciseName,              // exerciseTitle
              'Hold the position',   // subtitle
              'Time',                    // scoreTitle
              'seconds'               // scoreSubtitle
            );
          default:
            if (exerciseName === 'Lunge Jump') {
              detectorId = 'LungeJump';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Lateral Raises') {
              detectorId = 'LateralRaise';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Shoulder Taps Plank') {
              detectorId = 'PlankHighShoulderTaps';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 20;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else if (exerciseName === 'Rotation Jab Squat') {
              detectorId = 'SquatAndRotationJab';
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 12;
              uiElements = [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer];
            } else {
              detectorId = exerciseName;
              scoringType = SMWorkoutLibrary.ScoringType.Reps;
              targetReps = 10;
            }
            break;
        }

        return new SMWorkoutLibrary.SMAssessmentExercise(
          detectorId,           // name (using detector ID as name for consistency)
          35,                     // totalSeconds
          exerciseName === 'Alternate Windmill Toe Touch' ? 'AlternateWindmillToeTouch' : detectorId,            // videoInstruction
          null,                  // exerciseIntro
          uiElements,            // UI elements
          detectorId,            // detector
          '',                    // successSound
          new SMWorkoutLibrary.SMScoringParams(
            scoringType,         // scoring type based on exercise
            0.3,                 // threshold
            targetTime,          // targetTime (for plank and static holds)
            targetReps,          // targetReps (for dynamic exercises)
            null,                // targetDistance
            null                 // targetCalories
          ),
          '',                    // failedSound
          exerciseName,          // exerciseTitle (display name)
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',   // subtitle
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',  // scoreTitle
          scoringType === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'  // scoreSubtitle
        );
      });

      const workout = new SMWorkoutLibrary.SMWorkout(
        '50',
        'Custom Workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      const userData = new SMWorkoutLibrary.UserData(
        SMWorkoutLibrary.Gender.Male, // default gender
        25 // default age
      );
      const result = await startCustomAssessment(workout, userData, false, false);
      console.log('Assessment result:', result.summary);
      console.log('Did finish:', result.didFinish);
    } catch (e) {
      showAlert('Workout Error', e.message);
    }
  };

  const bodyPartToPlanId = {
    'Shoulders': 1, // Full Stack Fitness (example)
    'Chest': 2, // Fat Burner (example)
    'Thighs': 'thighs',
    'Hips & Glutes': 'hips-glutes',
    'Calves': 'calves',
    'Arms': 'arms',
    'Abs': 'abs',
    'Oblique': 'plank-core-stability',
    'Lower Back': 'lower-back',
  };

  const handleBodyPartPress = (label) => {
    const planId = bodyPartToPlanId[label];
    const plan = planData.find(p => p.id === planId || p.id === Number(planId));
    if (plan) {
      setSelectedPlan(plan);
      setShowPlanModal(true);
      setShowBodyPartsModal(false);
    }
  };

  // Add state for body parts modal search
  const [bodyPartsSearchResults, setBodyPartsSearchResults] = useState<any[]>([]);
  const [bodyPartsSearchPerformed, setBodyPartsSearchPerformed] = useState(false);

  // Handler for searching body parts in the modal
  const handleBodyPartsSearch = (text: string) => {
    setBodyPartsSearch(text);
    setBodyPartsSearchPerformed(true);
    if (!text.trim()) {
      setBodyPartsSearchResults([]);
      setBodyPartsSearchPerformed(false);
      return;
    }
    const lowerText = text.toLowerCase();
    const matches = bodyParts.filter(bp => bp.label.toLowerCase().includes(lowerText));
    setBodyPartsSearchResults(matches);
  };

  const [showTodaysPlanModal, setShowTodaysPlanModal] = useState(false);

  // Data for Today's Plan modal (from the image)
  const todaysPlanSections = [
    {
      title: 'WARM-UP',
      color: '#F44336',
      icon: '🔥',
      description: 'Perform each for 30 seconds',
      rest: 'Rest 30 sec',
      exercises: [
        'Jumping Jacks',
        'High Knees',
        'Glutes Bridge',
        'Standing Knee Raise (Left)',
        'Standing Knee Raise (Right)',
      ],
    },
    {
      title: 'UPPER BODY & CORE',
      color: '#0097A7',
      icon: '💪',
      description: '2 ROUNDS\n40s work | 20s rest | 60s rest between rounds',
      exercises: [
        '1. Shoulder Taps',
        '2. Plank',
        '3. Push-up (or Knee Push-up)',
        '4. Shoulder Press (simulate resistance)',
        '5. Side Plank (20s each)',
        '6. Crunches',
        '7. Oblique Crunches (20s each side)',
        '8. Reverse Sit to Table Top',
      ],
    },
    {
      title: 'FINISHER',
      color: '#1976D2',
      icon: '⚡',
      description: '30s each | No rest',
      exercises: [
        '1. Ski Jumps',
        '2. Skater Hops',
      ],
    },
    {
      title: 'COOLDOWN',
      color: '#FFA000',
      icon: '🧘',
      description: 'Hold each stretch 30s',
      exercises: [
        '1. Hamstring Mobility',
        '2. Standing Hamstring',
        '3. Jefferson Curl (slow, controlled)',
      ],
    },
  ];

  // Add a handler for starting a section
  const handleStartSection = async (section) => {
    // Map section to default duration
    let defaultDuration = 30;
    if (section.title === 'UPPER BODY & CORE') defaultDuration = 40;
    // Map exercise names to Sency detector IDs and scoring
    const exercises = section.exercises.map((ex) => {
      // Remove numbering and parenthesis
      let name = ex.replace(/^\d+\. /, '').replace(/\s*\(.*\)$/, '').trim();
      // Special cases for names
      if (name === 'Push-up or Knee Push-up' || name === 'Push-up (or Knee Push-up)') name = 'Push-ups';
      if (name === 'Shoulder Taps') name = 'Shoulder Taps Plank';
      if (name === 'Standing Knee Raise (Left)') name = 'Standing Knee Raise Left';
      if (name === 'Standing Knee Raise (Right)') name = 'Standing Knee Raise Right';
      if (name === 'Hamstring Mobility') name = 'Hamstring mobility';
      if (name === 'Standing Hamstring') name = 'Standing hamstring mobility';
      if (name === 'Oblique Crunches') name = 'Oblique Crunches';
      if (name === 'Reverse Sit to Table Top') name = 'Reverse Sit to Table Top';
      if (name === 'Side Plank') name = 'Side Plank';
      if (name === 'Shoulder Press (simulate resistance)') name = 'Shoulder Press';
      if (name === 'Crunches') name = 'Crunches';
      if (name === 'Plank') name = 'High Plank';
      if (name === 'Glutes Bridge') name = 'Glutes Bridge';
      if (name === 'Ski Jumps') name = 'Ski Jumps';
      if (name === 'Skater Hops') name = 'Skater Hops';
      if (name === 'Side Lunge') name = 'Side Lunge';
      if (name === 'Jefferson Curl (slow, controlled)') name = 'Jefferson curl';
      // Get detector and scoring
      const detectorId = exerciseIdMap[name];
      const scoring = exerciseScoringMap[name];
      if (!detectorId || !scoring) return null;
      return new SMWorkoutLibrary.SMAssessmentExercise(
        detectorId,
        defaultDuration,
        detectorId,
        null,
        scoring.ui,
        detectorId,
        '',
        new SMWorkoutLibrary.SMScoringParams(
          scoring.type,
          0.3,
          scoring.type === SMWorkoutLibrary.ScoringType.Time ? defaultDuration : null,
          scoring.type === SMWorkoutLibrary.ScoringType.Reps ? 10 : null,
          null,
          null
        ),
        '',
        name,
        scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',
        scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',
        scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'
      );
    }).filter(Boolean);
    if (exercises.length === 0) {
      Alert.alert('No exercises found for this section.');
      return;
    }
    const customWorkout = new SMWorkoutLibrary.SMWorkout(
      section.title.toLowerCase().replace(/\s+/g, '-'),
      section.title,
      null,
      null,
      exercises,
      null,
      null,
      null
    );
    try {
      await startCustomAssessment(customWorkout, null, true, false);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isNightMode && { backgroundColor: '#111' }]}>
      <ScrollView contentContainerStyle={[styles.mainContainer, { flexGrow: 1 }, isNightMode && { backgroundColor: '#111' }]}>
      {isLoading && <ActivityIndicator size="large" color="#C4A484" />}
      
        {/* Credit Counter at Top Right (restored) */}
      {/* Removed creditCounterContainer, profileSection, dark mode button, and motivational quote */}

      {/* Header Section - Remove logo and welcome text */}
      {/* <View style={styles.headerContainer}>
        <Image 
            source={require('./assets/logo1.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Welcome to </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text style={[styles.titleText, { color: 'white' }]}>Ar</Text>
            <Text style={[styles.titleText, { color: '#E08714' }]}>thlete</Text>
            <Text style={[styles.titleText, { color: 'white' }]}> AI Experience</Text>
          </View>
        </View> */}

      {/* Profile Button and Motivational Quote */}
      {/* Removed profileSection, profileButton, profileIcon, motivationalQuote, featureButtonRow, featureButton, featureButtonRanks, featureButtonProgress, featureButtonTracker, featureButtonCommunity, featureButtonSelected, featureIcon, featureLabel, carouselContainer, carouselContent, bannerContainer, bannerTitle, bannerSubtitle, plansCarousel, plansCarouselContent, planContainer, planText, burnCaloriesContainer, burnCaloriesHeading, burnCaloriesDescription, fitnessMetricsSection, fitnessMetricsHeader, fitnessMetricsTitle, fitnessMetricsSeeAll, metricsCarousel, metricsCarouselContent, metricCard, scoreCard, hydrationCard, caloriesCard, metricCardTitle, chartPlaceholder, circlesPlaceholder, metricCardValue, barChartContainer, bar, lineGraphContainer, goalLine, userInputLine, progressBarContainer, progressBarFill */}

        {/* New Section: Fitness Metrics */}
        {/* Removed fitnessMetricsSection and its content */}

        {/* New Section: Burn Calories Fast */}
        {/* Removed Burn Calories Fast PlanSection */}

        {/* New Section: Plank & Mobility */}
        {/* Removed Plank & Mobility PlanSection */}

        {/* New Section: Cardio */}
        {/* Removed Cardio PlanSection */}

        {/* Move Modals outside ScrollView for iOS compatibility */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255, 168, 38, 0.10)'}}>
          <View style={styles.modalContainer}>
            <ScrollView contentContainerStyle={{padding: 0}}>
              {parsedSummaryData ? (
                <View style={{padding: 0}}>
                  {/* Header */}
                  <View style={{backgroundColor: '#FFA726', paddingVertical: 22, paddingHorizontal: 18, alignItems: 'center'}}>
                    <Text style={{color: '#fff', fontSize: 26, fontWeight: 'bold', letterSpacing: 1}}>Workout Summary</Text>
                  </View>
                  {/* Exercises */}
                  <View style={{padding: 20, paddingTop: 20}}>
                    <Text style={{color: '#FFA726', fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>Exercises</Text>
                    {parsedSummaryData.exercises && parsedSummaryData.exercises.length > 0 && parsedSummaryData.exercises.map((exercise, index) => (
                      <View key={index} style={{backgroundColor: '#FFE5B4', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#FFA726', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2}}>
                        <Text style={{color: '#FF9800', fontWeight: 'bold', fontSize: 16, marginBottom: 2}}>💪 {exercise.pretty_name || exercise.exercise_id || `Exercise ${index + 1}`}</Text>
                        <Text style={{color: '#FF9800', fontWeight: 'bold'}}>Score: <Text style={{color: '#333', fontWeight: 'normal'}}>{exercise.total_score !== undefined ? exercise.total_score : 'N/A'}</Text></Text>
                        <Text style={{color: '#FF9800', fontWeight: 'bold'}}>Reps: <Text style={{color: '#333', fontWeight: 'normal'}}>{exercise.reps_performed !== undefined ? exercise.reps_performed : 0} ({exercise.reps_performed_perfect !== undefined ? exercise.reps_performed_perfect : 0} perfect)</Text></Text>
                        <Text style={{color: '#FF9800', fontWeight: 'bold'}}>Time: <Text style={{color: '#333', fontWeight: 'normal'}}>{exercise.time_in_position !== undefined ? `${exercise.time_in_position.toFixed(2)}s` : '0.00s'}</Text></Text>
                        </View>
                      ))}
                    </View>
                  {/* Performance Analysis (optional) */}
                  {(performanceAnalysis.strengths.length > 0 || performanceAnalysis.improvements.length > 0) && (
                    <View style={{paddingHorizontal: 20, paddingBottom: 18}}>
                      <Text style={{color: '#FFA726', fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>Performance Analysis</Text>
                      {performanceAnalysis.strengths.length > 0 && (
                        <View style={{marginBottom: 6}}>
                          <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>✅ Strengths:</Text>
                          {performanceAnalysis.strengths.map((strength, idx) => (
                            <Text key={idx} style={{color: '#333', marginLeft: 8}}>{strength}</Text>
                          ))}
                        </View>
                      )}
                      {performanceAnalysis.improvements.length > 0 && (
                        <View>
                          <Text style={{color: '#E53935', fontWeight: 'bold'}}>⚠️ Areas to Improve:</Text>
                          {performanceAnalysis.improvements.map((improvement, idx) => (
                            <Text key={idx} style={{color: '#333', marginLeft: 8}}>{improvement}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.modalText}>{summaryMessage}</Text>
              )}
            </ScrollView>
            {/* Close Button fixed at the bottom */}
            <TouchableOpacity
              style={{backgroundColor: '#FF7043', borderBottomLeftRadius: 22, borderBottomRightRadius: 22, paddingVertical: 18, alignItems: 'center'}}
              onPress={() => setModalVisible(false)}>
              <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 18}}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Modal for Assessment Info */}
      <Modal
        transparent={true}
        visible={assessmentInfoModalVisible}
        animationType="slide"
        onRequestClose={() => setAssessmentInfoModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView>
              <Text style={styles.modalTitle}>Assessment Exercises</Text>
              {currentAssessmentExercises.length > 0 ? (
                currentAssessmentExercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseInfoContainer}>
                    <Text style={styles.exerciseInfoName}>{exercise.name}</Text>
                    {exercise.description && <Text style={styles.exerciseInfoDescription}>{exercise.description}</Text>}
                  </View>
                ))
              ) : (
                <Text style={styles.modalText}>No exercise information available for this assessment type.</Text>
              )}
            </ScrollView>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.startButton]} // Reusing startButton style
                onPress={startAssessmentFromInfoModal}>
                <Text style={styles.buttonText}>Start Assessment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={() => setAssessmentInfoModalVisible(false)}>
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

        {/* Add the bottom modal for plan details */}
        <Modal
          visible={showPlanModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowPlanModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' }}>
            <SafeAreaView style={{ flex: 1, backgroundColor: isNightMode ? '#111' : '#fff' }}>
              {selectedPlan && (
                <>
                  {/* Close Button */}
                  <TouchableOpacity
                    onPress={() => setShowPlanModal(false)}
                    style={{
                      position: 'absolute',
                      top: Platform.OS === 'android' ? 40 : 70,
                      right: 24,
                      zIndex: 10,
                      backgroundColor: '#fff',
                      borderRadius: 24,
                      width: 44,
                      height: 44,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.12,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text style={{ fontSize: 28, color: '#E53935', fontWeight: 'bold', lineHeight: 30 }}>×</Text>
                  </TouchableOpacity>
                  {/* Plan Image */}
                  <Image
                    source={selectedPlan.image}
                    style={{ width: '100%', height: 220, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderRadius: 0, resizeMode: 'cover' }}
                  />
                  {/* Plan Info Header and all modal content in a ScrollView */}
                  <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
                    <Text style={{ color: isNightMode ? '#fff' : '#111', fontSize: 26, fontWeight: 'bold', marginBottom: 8 }}>{selectedPlan.name}</Text>
                    <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 16, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>
                          {selectedLevel.charAt(0).toUpperCase() + selectedLevel.slice(1)}
                        </Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Level</Text>
    </View>
                      <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 18, marginHorizontal: 28, marginTop: 2 }}>|</Text>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>
                          {(() => {
                            const totalSeconds = selectedPlan.exercises.reduce((sum, ex) => sum + (ex.duration?.[selectedLevel] || 0), 0);
                            const mins = Math.floor(totalSeconds / 60);
                            const secs = totalSeconds % 60;
                            return mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs}s` : ''}` : `${secs}s`;
                          })()}
                        </Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Time</Text>
                      </View>
                      <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 18, marginHorizontal: 28, marginTop: 2 }}>|</Text>
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 16 }}>Abs</Text>
                        <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 13 }}>Focus Area</Text>
                      </View>
                    </View>
                    {/* Level Selection UI - moved here */}
                    <View style={{ marginBottom: 28 }}>
                      <Text style={{ fontSize: 18, fontWeight: '600', color: isNightMode ? '#fff' : '#000', marginBottom: 12 }}>
                        Select Level
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                        {['beginner', 'performer', 'advanced'].map((level) => (
                          <TouchableOpacity
                            key={level}
                            style={{
                              flex: 1,
                              minWidth: 0, // Important for iOS
                              marginHorizontal: 2,
                              padding: 12,
                              borderRadius: 8,
                              backgroundColor: selectedLevel === level ? '#2196F3' : isNightMode ? '#333' : '#f0f0f0',
                              alignItems: 'center',
                            }}
                            onPress={() => {
                              setSelectedLevel(level);
                              setStartDisabled(true);
                              setTimeout(() => setStartDisabled(false), 200);
                            }}
                          >
                            <Text
                              style={{
                                color: selectedLevel === level ? '#fff' : isNightMode ? '#fff' : '#000',
                                fontWeight: '600',
                                textTransform: 'capitalize',
                                textAlign: 'center',
                              }}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {level === 'performer' ? 'Performer' : level.charAt(0).toUpperCase() + level.slice(1)}
                            </Text>
                            <Text
                              style={{
                                color: selectedLevel === level ? '#fff' : isNightMode ? '#aaa' : '#666',
                                fontSize: 12,
                                marginTop: 4,
                                textAlign: 'center',
                              }}
                              numberOfLines={1}
                              ellipsizeMode='tail'
                            >
                              {levelDurations[level]}s
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    {/* Exercises List */}
                    <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 20, marginBottom: 12 }}>Exercises ({selectedPlan.exercises.length})</Text>
                    {selectedPlan.exercises && Array.isArray(selectedPlan.exercises) && selectedPlan.exercises.map((ex, idx) => (
                      ex && ex.name ? (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                          {/* Placeholder avatar for each exercise */}
                          <View style={{ width: 60, height: 60, borderRadius: 12, backgroundColor: isNightMode ? '#222' : '#eee', marginRight: 16, justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ color: isNightMode ? '#fff' : '#111', fontSize: 28 }}>{ex.name[0]}</Text>
                          </View>
                          <View>
                            <Text style={{ color: isNightMode ? '#fff' : '#111', fontWeight: 'bold', fontSize: 17 }}>{ex.name}</Text>
                            <Text style={{ color: isNightMode ? '#aaa' : '#888', fontSize: 15 }}>{ex.detail}</Text>
                          </View>
                        </View>
                      ) : null
                    ))}
                    {/* Disclaimer below the exercise list */}
                    <View style={{ marginTop: 18, marginBottom: 8 }}>
                      <Text style={{ color: isNightMode ? '#E53935' : '#B71C1C', fontSize: 14, textAlign: 'center', fontWeight: '600' }}>
                        Please keep your mobile phone on a stable surface (preferably on the ground) and step back and stand in the Frame.
                      </Text>
                    </View>
                  </ScrollView>
                  {/* Start Button */}
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24, backgroundColor: isNightMode ? '#111' : '#fff' }}>
                    <TouchableOpacity
                      style={{ backgroundColor: startDisabled ? '#90caf9' : '#2196F3', borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}
                      disabled={startDisabled}
                      onPress={() => {
                        setStartDisabled(true);
                        setShowPlanModal(false);
                        setTimeout(async () => {
                          if (selectedPlan) {
                            // Use selectedPlan and selectedLevel for any plan
                            const customExercises = selectedPlan.exercises.map((exercise, idx) => {
                              const scoring = exerciseScoringMap[exercise.name] || { type: SMWorkoutLibrary.ScoringType.Reps, ui: [SMWorkoutLibrary.UIElement.RepsCounter, SMWorkoutLibrary.UIElement.Timer] };
                              // Special handling for Plank & Core Stability exercises
                              if (["High Plank", "Side Plank", "Tuck Hold", "Plank", "Hamstring mobility", "Standing hamstring mobility", "Side bend", "Standing knee raises", "Jefferson curl"].includes(exercise.name)) {
                                const scoring = exerciseScoringMap[exercise.name];
                                return new SMWorkoutLibrary.SMAssessmentExercise(
                                  exerciseIdMap[exercise.name],
                                  exercise.duration[selectedLevel],
                                  exerciseIdMap[exercise.name],
                                  null,
                                  scoring.ui,
                                  exerciseIdMap[exercise.name],
                                  '',
                                  new SMWorkoutLibrary.SMScoringParams(
                                    scoring.type,
                                    0.3,
                                    scoring.type === SMWorkoutLibrary.ScoringType.Time ? exercise.duration[selectedLevel] : null,
                                    scoring.type === SMWorkoutLibrary.ScoringType.Reps ? exercise.reps[selectedLevel] : null,
                                    null,
                                    null
                                  ),
                                  '',
                                  exercise.name,
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'
                                );
                              } else {
                                return new SMWorkoutLibrary.SMAssessmentExercise(
                                  exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                  exercise.duration[selectedLevel],
                                  exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                  null,
                                  scoring.ui,
                                  exerciseIdMap[exercise.name] || exercise.name.replace(/\s+/g, ''),
                                  '',
                                  new SMWorkoutLibrary.SMScoringParams(
                                    scoring.type,
                                    0.3,
                                    scoring.type === SMWorkoutLibrary.ScoringType.Time ? exercise.duration[selectedLevel] : null,
                                    scoring.type === SMWorkoutLibrary.ScoringType.Reps ? exercise.reps[selectedLevel] : null,
                                    null,
                                    null
                                  ),
                                  '',
                                  exercise.name,
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Hold the position' : 'Complete the exercise',
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'Time' : 'Reps',
                                  scoring.type === SMWorkoutLibrary.ScoringType.Time ? 'seconds held' : 'clean reps'
                                );
                              }
                            });
                            const customWorkout = new SMWorkoutLibrary.SMWorkout(
                              selectedPlan.name.toLowerCase().replace(/\s+/g, '-'),
                              selectedPlan.name,
                              null,
                              null,
                              customExercises,
                              null,
                              null,
                              null
                            );
                            try {
                              const result = await startCustomAssessment(customWorkout, null, true, false);
                              
                              // Add a small delay before showing the summary modal
                              await new Promise(resolve => setTimeout(resolve, 1000));
                              
                              setSummaryMessage(result.summary);
                              const parsed = JSON.parse(result.summary);
                              setParsedSummaryData(parsed);
                              setModalVisible(true);
                            } catch (e) {
                              Alert.alert('Assessment Error', e.message);
                            }
                          }
                          setStartDisabled(false);
                        }, 1000);
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>Start</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </SafeAreaView>
          </View>
        </Modal>

      {/* Workout Heading at the very top */}
      <Text style={{ fontSize: 28, fontWeight: 'bold', textAlign: 'left', color: '#111', marginTop: 6, marginBottom: 10, marginLeft: 16 }}>Workout Plans</Text>

      {/* Search Bar below Workout heading */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        borderRadius: 16,
        width: '97%',
        alignSelf: 'center',
        marginBottom: 16,
        paddingHorizontal: 10,
      }}>
        <Text style={{ fontSize: 20, color: '#bbb', marginRight: 6 }}>🔍</Text>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            borderRadius: 16,
            paddingVertical: Platform.select({ ios: 14, default: 8 }),
            paddingHorizontal: 0,
            fontSize: 16,
            color: '#222',
          }}
          placeholder="Search workouts, plans, or body parts..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>
      {/* Show search results if search is performed */}
      {searchPerformed && (
        <View style={{ width: '97%', alignSelf: 'center', marginBottom: 16 }}>
          {searchResults.length === 0 ? (
            <Text style={{ color: '#E53935', fontSize: 18, textAlign: 'center', marginVertical: 12 }}>No search found</Text>
          ) : (
            <ScrollView style={{ maxHeight: 220 }}>
              {searchResults.map((result, idx) => {
                if (result.type === 'plan') {
                  return (
                    <TouchableOpacity key={idx} onPress={() => { setSelectedPlan(result.data); setShowPlanModal(true); }} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#111' }}>{result.data.name}</Text>
                      <Text style={{ color: '#888', fontSize: 14 }}>Plan</Text>
                    </TouchableOpacity>
                  );
                } else if (result.type === 'bodyPart') {
                  return (
                    <TouchableOpacity key={idx} onPress={() => handleBodyPartPress(result.data.label)} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#111' }}>{result.data.label}</Text>
                      <Text style={{ color: '#888', fontSize: 14 }}>Body Focus Area</Text>
                    </TouchableOpacity>
                  );
                } else if (result.type === 'exercise') {
                  return (
                    <View key={idx} style={{ padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#111' }}>{result.data.name}</Text>
                      <Text style={{ color: '#888', fontSize: 14 }}>Exercise in {result.data.planName}</Text>
                    </View>
                  );
                }
                return null;
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Custom Workout Card Section */}
      <View style={{ marginTop: 10, marginBottom: 20 }}>
        <View style={{
          backgroundColor: '#e8f5e9',
          borderColor: '#4CAF50',
          borderWidth: 2,
          borderRadius: 20,
          padding: 18,
          marginHorizontal: 0,
          width: '97%',
          alignSelf: 'center',
          shadowColor: '#4CAF50',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#222', letterSpacing: 1, marginBottom: 6 }}>
            CUSTOM WORKOUT <Text style={{ fontSize: 18 }}>🛠️</Text>
          </Text>
          <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#222', marginBottom: 8 }}>
            Customise your own{`\n`}workout
          </Text>
          <Text style={{ fontSize: 16, color: '#333', marginBottom: 20 }}>
            Create a session with exercises and settings tailored by you.
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#111',
              borderRadius: 32,
              paddingVertical: 10, // reduced height
              alignItems: 'center',
              marginTop: 6,
            }}
            onPress={async () => {
              setIsLoading(true);
              await startAssessmentSession(
                SMWorkoutLibrary.AssessmentTypes.Fitness,
                true,
                ''
              );
              setIsLoading(false);
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Custom</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Plan Section */}
      <Text style={{ fontSize: 26, fontWeight: 'bold', color: '#111', marginLeft: 16, marginBottom: 10 }}>Today's Plan</Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderColor: '#111',
        borderWidth: 2,
        borderRadius: 20,
        padding: 16,
        marginHorizontal: 0,
        width: '97%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
        marginBottom: 24,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#3b82f6', fontSize: 16, marginBottom: 2 }}>Day 1</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#222', marginBottom: 2 }}>Full Body Strength</Text>
          <Text style={{ color: '#789', fontSize: 15 }}>45 min · 5 exercises</Text>
        </View>
        <TouchableOpacity
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 10,
            backgroundColor: 'transparent',
            overflow: 'hidden',
          }}
          onPress={() => setShowTodaysPlanModal(true)}
        >
          <Image
            source={require('./assets/PlayButton2.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Body Focus Area Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111' }}>Body Focus Area</Text>
        <TouchableOpacity onPress={() => setShowBodyPartsModal(true)}>
          <Text style={{ fontSize: 16, color: '#1db954', fontWeight: 'bold' }}>See more</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 8 }}>
        {/* Shoulders Card */}
        <TouchableOpacity onPress={() => handleBodyPartPress('Shoulders')} style={{ flex: 1, maxWidth: '48%', marginHorizontal: 4, alignItems: 'center' }}>
          <View style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#fff',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              source={require('./assets/Shoulder.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 2 }}>Shoulders</Text>
        </TouchableOpacity>
        {/* Chest Card */}
        <TouchableOpacity onPress={() => handleBodyPartPress('Chest')} style={{ flex: 1, maxWidth: '48%', marginHorizontal: 4, alignItems: 'center' }}>
          <View style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#fff',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              source={require('./assets/Chest.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 2 }}>Chest</Text>
        </TouchableOpacity>
      </View>
      {/* Second row: Thighs and Hips & Glutes */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, paddingHorizontal: 8, marginTop: -8 }}>
        {/* Thighs Card */}
        <TouchableOpacity onPress={() => handleBodyPartPress('Thighs')} style={{ flex: 1, maxWidth: '48%', marginHorizontal: 4, alignItems: 'center' }}>
          <View style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#fff',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              source={require('./assets/Thighs.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 2 }}>Thighs</Text>
        </TouchableOpacity>
        {/* Hips & Glutes Card */}
        <TouchableOpacity onPress={() => handleBodyPartPress('Hips & Glutes')} style={{ flex: 1, maxWidth: '48%', marginHorizontal: 4, alignItems: 'center' }}>
          <View style={{
            width: '100%',
            aspectRatio: 1,
            backgroundColor: '#fff',
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.10,
            shadowRadius: 6,
            elevation: 3,
            marginBottom: 8,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Image
              source={require('./assets/Hips.png')}
              style={{ width: '100%', height: '100%', borderRadius: 24 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 2 }}>Hips & Glutes</Text>
        </TouchableOpacity>
      </View>

      </ScrollView>
      <Modal
        visible={showBodyPartsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowBodyPartsModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <TouchableOpacity onPress={() => setShowBodyPartsModal(false)}>
              <Text style={{ color: '#2196F3', fontSize: 20, fontWeight: 'bold' }}>{'← Back'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f7f7f7',
            borderRadius: 16,
            marginHorizontal: 8,
            marginBottom: 18,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: '#eee',
            height: 48,
          }}>
            <Text style={{ fontSize: 22, color: '#bbb', marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, fontSize: 18, color: '#222', backgroundColor: 'transparent' }}
              placeholder="Search body part..."
              placeholderTextColor="#aaa"
              value={bodyPartsSearch}
              onChangeText={handleBodyPartsSearch}
            />
          </View>
          {/* Show search results if search is performed in modal */}
          {bodyPartsSearchPerformed && (
            <View style={{ width: '97%', alignSelf: 'center', marginBottom: 16 }}>
              {bodyPartsSearchResults.length === 0 ? (
                <Text style={{ color: '#E53935', fontSize: 18, textAlign: 'center', marginVertical: 12 }}>No search found</Text>
              ) : (
                <ScrollView style={{ maxHeight: 220 }}>
                  {bodyPartsSearchResults.map((bp, idx) => (
                    <TouchableOpacity
                      key={bp.label}
                      style={{ padding: 12, backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#eee' }}
                      onPress={() => handleBodyPartPress(bp.label)}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#111' }}>{bp.label}</Text>
                      <Text style={{ color: '#888', fontSize: 14 }}>Body Focus Area</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
          {/* ... existing code for showing all body parts if not searching ... */}
          {!bodyPartsSearchPerformed && (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {filteredBodyParts.map((bp, idx) => (
                  <TouchableOpacity
                    key={bp.label}
                    style={{ width: '48%', alignItems: 'center', marginBottom: 32 }}
                    onPress={() => handleBodyPartPress(bp.label)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 8,
                    }}>
                      <Image source={bp.image} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    </View>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111', textAlign: 'center' }}>{bp.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Today's Plan Modal */}
      {showTodaysPlanModal && (
        <Modal
          visible={showTodaysPlanModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowTodaysPlanModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
                {/* Close Button */}
                <TouchableOpacity
                  style={{ position: 'absolute', top: 28, left: 10, zIndex: 10, backgroundColor: '#fff', borderRadius: 18, width: 36, height: 36, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 4, elevation: 2 }}
                  onPress={() => setShowTodaysPlanModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22, color: '#E53935', fontWeight: 'bold', lineHeight: 24 }}>×</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#111', textAlign: 'center', marginBottom: 18, marginTop: 10 }}>Today's Plan</Text>
                {todaysPlanSections.map((section, idx) => (
                  <View key={section.title} style={{ marginBottom: 18, backgroundColor: section.color + '22', borderRadius: 12, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 22, fontWeight: 'bold', color: section.color, marginRight: 8 }}>{section.icon}</Text>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: section.color }}>{section.title}</Text>
                    </View>
                    <Text style={{ color: section.color, fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>{section.description}</Text>
                    {section.rest && <Text style={{ color: section.color, fontSize: 14, marginBottom: 4 }}>{section.rest}</Text>}
                    {section.exercises.map((ex, i) => (
                      <Text key={i} style={{ color: '#111', fontSize: 16, marginLeft: 10, marginBottom: 2 }}>✔ {ex}</Text>
                    ))}
                    <TouchableOpacity
                      style={{ backgroundColor: section.color, borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 10 }}
                      onPress={() => handleStartSection(section)}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Start</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );

async function configureSMKitUI() {
  setIsLoading(true);
  try {
    
    var res = await configure("public_live_a5jSYbzaDk7sgalguc");
    console.log("Configuration successful:", res);
    setIsLoading(false);
    setDidConfig(true);
  } catch (e) {
    setIsLoading(false);
    Alert.alert('Configure Failed', e.message, [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
  }
}

async function startWorkoutProgramSession() {
  try {
    const parsedWeek = parseInt(week, 10);
    if (isNaN(parsedWeek)) {
      throw new Error('Invalid week number');
    }
    var config = new SMWorkoutLibrary.WorkoutConfig(
      parsedWeek,
      bodyZone,
      difficulty,
      duration,
      language,
      name,
    );
    var result = await startWorkoutProgram(config);
    console.log(result.summary);
    console.log(result.didFinish);
  } catch (e) {
    Alert.alert('Unable to start workout program', e.message, [{ text: 'OK', onPress: () => console.log('OK Pressed') }]);
  }
}
async function startAssessmentSession(
  type: SMWorkoutLibrary.AssessmentTypes,
  showSummary: boolean,
  customAssessmentID: string
) {
  try {
    console.log('Starting assessment with type:', type);
    const result = await startAssessment(
      type,
      showSummary,
      null,
      false,
      customAssessmentID
    );
    console.log('Assessment result:', result.summary);
    console.log('Did finish:', result.didFinish);
    // Set summary and show modal directly (cross-platform)
    setSummaryMessage(result.summary);
    let parsed: any = null;
    try {
      parsed = JSON.parse(result.summary);
      setParsedSummaryData(parsed);
    } catch (e) {
      setParsedSummaryData(null);
    }
    setModalVisible(true);
  } catch (e) {
    console.error('Assessment error:', e);
    Alert.alert('Unable to start assessment', e.message);
  }
}

async function startSMKitUICustomWorkout() {
  try {
    var exercises = [
      new SMWorkoutLibrary.SMAssessmentExercise(
        'SquatRegularOverheadStatic',
        30,
        'SquatRegularOverheadStatic',
        null,
        [
          SMWorkoutLibrary.UIElement.GaugeOfMotion,
          SMWorkoutLibrary.UIElement.Timer,
        ],
        'SquatRegularOverheadStatic',
        'stam',
        new SMWorkoutLibrary.SMScoringParams(
          SMWorkoutLibrary.ScoringType.Time,
          0.5,
          20,
          null,
          null,
          null,
        ),
        '',
        'SquatRegularOverheadStatic',
        'Subtitle',
        'timeInPosition',
        'clean reps'
      ),
      new SMWorkoutLibrary.SMAssessmentExercise(
        'Jefferson Curl',
        30,
        'JeffersonCurlRight',
        null,
        [
          SMWorkoutLibrary.UIElement.GaugeOfMotion,
          SMWorkoutLibrary.UIElement.Timer,
        ],
        'JeffersonCurlRight',
        'stam',
        new SMWorkoutLibrary.SMScoringParams(
          SMWorkoutLibrary.ScoringType.Time,
          0.5,
          20,
          null,
          null,
          null,
        ),
        '',
        'JeffersonCurlRight',
        'Subtitle',
        'timeInPosition',
        'clean reps'
      ),
      new SMWorkoutLibrary.SMAssessmentExercise(
        'Push-Up',
        30,
        'PushupRegular',
        null,
        [
          SMWorkoutLibrary.UIElement.RepsCounter,
          SMWorkoutLibrary.UIElement.Timer,
        ],
        'PushupRegular',
        'stam',
        new SMWorkoutLibrary.SMScoringParams(
          SMWorkoutLibrary.ScoringType.Reps,
          0.5,
          null,
          6,
          null,
          null,
        ),
        '',
        'PushupRegular',
        'Subtitle',
        'Reps',
        'clean reps'
      ),
      new SMWorkoutLibrary.SMAssessmentExercise(
        'LungeFrontRight',
        30,
        'LungeFrontRight',
        null,
        [
          SMWorkoutLibrary.UIElement.GaugeOfMotion,
          SMWorkoutLibrary.UIElement.Timer,
        ],
        'LungeFront',
        'stam',
        new SMWorkoutLibrary.SMScoringParams(
          SMWorkoutLibrary.ScoringType.Reps,
          0.5,
          null,
          20,
          null,
          null,
        ),
        '',
        'LungeFrontRight',
        'Subtitle',
        'timeInPosition',
        'clean reps'
      ),
      new SMWorkoutLibrary.SMAssessmentExercise(
        'LungeFrontLeft',
        30,
        'LungeFrontLeft',
        null,
        [
          SMWorkoutLibrary.UIElement.GaugeOfMotion,
          SMWorkoutLibrary.UIElement.Timer,
        ],
        'LungeFront',
        'stam',
        new SMWorkoutLibrary.SMScoringParams(
          SMWorkoutLibrary.ScoringType.Reps,
          0.5,
          null,
          20,
          null,
          null,
        ),
        '',
        'LungeFrontLeft',
        'Subtitle',
        'timeInPosition',
        'clean reps'
      ),
    ];

    var assessment = new SMWorkoutLibrary.SMWorkout(
      '50',
      'demo workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      var result = await startCustomWorkout(assessment);
      console.log(result.summary);
      console.log(result.didFinish);
    } catch (e) {
      console.error(e);
      showAlert('Custom workout error', e.message);
    }
  }

  async function startSMKitUICustomAssessment() {
    try {
      // Set language and preferences first
      await setSessionLanguage(SMWorkoutLibrary.Language.Hebrew);
      setEndExercisePreferences(SMWorkoutLibrary.EndExercisePreferences.TargetBased);
      setCounterPreferences(SMWorkoutLibrary.CounterPreferences.PerfectOnly);

      // Optional: Use local sound files instead of URLs
      const successSound = '';  // Remove URL and use local file or leave empty
      const failedSound = '';   // Remove URL and use local file or leave empty

      const exercises = [
        new SMWorkoutLibrary.SMAssessmentExercise(
          'SquatRegular',
          35,
          'SquatRegular',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'SquatRegular',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'SquatRegular',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'LungeFront',
          35,
          'LungeFront',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'LungeFront',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'LungeFront',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'HighKnees',
          35,
          'HighKnees',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'HighKnees',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Reps,
            0.3,
            null,
            5,
            null,
            null,
          ),
          failedSound,
          'HighKnees',
          'Subtitle',
          'Reps',
          'clean reps'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'SquatRegularOverheadStatic',
          35,
          'SquatRegularOverheadStatic',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'SquatRegularOverheadStatic',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'SquatRegularOverheadStatic',
          'Subtitle',
          'Time',
          'seconds held'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'PlankHighStatic',
          35,
          'PlankHighStatic',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'PlankHighStatic',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'PlankHighStatic',
          'Subtitle',
          'Time',
          'seconds held'
        ),
        new SMWorkoutLibrary.SMAssessmentExercise(
          'StandingSideBendRight',
          35,
          'StandingSideBendRight',
          null,
          [
            SMWorkoutLibrary.UIElement.RepsCounter,
            SMWorkoutLibrary.UIElement.Timer,
          ],
          'StandingSideBendRight',
          successSound,
          new SMWorkoutLibrary.SMScoringParams(
            SMWorkoutLibrary.ScoringType.Time,
            0.3,
            15,
            null,
            null,
            null,
          ),
          failedSound,
          'StandingSideBendRight',
          'Subtitle',
          'Time',
          'seconds held'
        ),
      ];

      var assessment = new SMWorkoutLibrary.SMWorkout(
        '50',
        'demo workout',
        null,
        null,
        exercises,
        null,
        null,
        null,
      );

      var result = await startCustomAssessment(assessment, null, true, false);
      console.log('Assessment result:', result.summary);
      console.log('Did finish:', result.didFinish);
    } catch (e) {
      console.error('Custom assessment error:', e);
      showAlert('Custom assessment error', e.message);
    }
  }
};

function showAlert(title, message) {
  Alert.alert(title, message, [
    { text: 'OK', onPress: () => console.log('OK Pressed') },
  ]);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: '3%',
    paddingTop: '3%',
    paddingBottom: '3%',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    color: '#000000', // Black text for visibility on white background
  },
  personalizedPlansText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'left',
    marginTop: -80,
    marginBottom: 15,
    // Removed paddingHorizontal: '5%',
  },
  headerContainer: {
    marginTop: '2%',
    marginBottom: '4%',
  },
  logo: {
    width: '20%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: 0,
    borderRadius: 20,
  },
  welcomeText: {
    marginRight: 10,
    fontSize: 24,
    color: '#FF9800', // Orange text
    opacity: 0.85,
  },
  titleText: {
    fontSize:27,
    color: '#FF9800', // Orange text
    fontWeight: 'bold',
  },
  categoryScrollContainer: {
    flex: 1,
    marginBottom: 10,
  },
  categoryContainer: {
    width: '100%',
  },
  categoryButton: {
    width: '100%',
    height: '8%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE5B4', // Light orange border
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginBottom: '2%',
    backgroundColor: '#FFF7ED', // Very light orange background
  },
  categoryText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    textAlign: 'center',
  },
  instructionText: {
    color: '#FFA726', // Orange accent
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
  },
  exerciseScrollContainer: {
    flex: 1,
    marginBottom: 10,
  },
  exerciseContainer: {
    width: '100%',
  },
  exerciseButton: {
    width: '100%',
    height: '8%',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFE5B4', // Light orange border
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '5%',
    marginBottom: '2%',
    backgroundColor: '#FFF7ED', // Very light orange background
  },
  exerciseText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    textAlign: 'center',
  },
  bottomContainer: {
    marginTop: '2%',
    paddingBottom: '2%',
  },
  startButton: {
    width: '100%',
    height: '8%',
    borderRadius: 25,
    backgroundColor: '#FFA726', // Orange
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2%',
    shadowColor: '#FFA726',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  learnMoreText: {
    color: '#FFA726',
    fontSize: 16,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF7ED', // Very light orange
    borderRadius: 10,
    padding: '5%',
    elevation: 5,
    borderColor: '#FFA726',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 15,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA726',
    marginTop: 10,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFA726',
    paddingBottom: 3,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'left',
    color: '#FF9800',
    fontSize: 14,
  },
  modalDataText: {
    color: '#FFA726',
    fontSize: 14,
    marginBottom: 4,
  },
  exerciseContainerModal: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  exerciseTitleModal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#FFA726',
    borderRadius: 5,
    padding: 10,
    width: '45%',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#FF7043', // Deeper orange for close
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  selectedExercise: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)', // Light orange highlight
    borderColor: '#FFA726',
  },
  disabledButton: {
    opacity: 0.5,
  },
  creditCounterContainer: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: '#fff', // White background
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    zIndex: 2,
    elevation: 6,
    shadowColor: '#FFA726', // Orange shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#FFA726', // Orange border
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditCounterText: {
    color: '#FF9800', // Orange text
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  analysisContainer: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  analysisText: {
    color: '#FFA726',
    fontSize: 14,
    marginBottom: 4,
  },
  restartContainer: {
    backgroundColor: '#FFA726',
    borderRadius: 8,
    padding: '3%',
    marginTop: '3%',
    marginBottom: '2%',
  },
  restartText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  // New styles for assessment info modal
  exerciseInfoContainer: {
    backgroundColor: '#FFE5B4', // Light orange
    borderRadius: 8,
    padding: '3%',
    marginBottom: '2%',
    borderColor: '#FFA726',
    borderWidth: 0.5,
  },
  exerciseInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 5,
  },
  exerciseInfoDescription: {
    color: '#FFA726',
    fontSize: 14,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: '4%',
  },
  profileSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '4%',
    marginTop: '2%',
  },
  profileButton: {
    width: '12%',
    aspectRatio: 1,
    borderRadius: 20,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '1.5%',
  },
  profileIcon: {
    color: 'white',
    fontSize: 24,
  },
  motivationalQuote: {
    color: '#000000',
    fontSize: 16,
    maxWidth: '60%',
    textAlign: 'left',
    marginBottom: '4%',
  },
  featureButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center', // Center horizontally
    alignItems: 'center',
    marginTop: '2%',
    marginBottom: '1.5%',
    width: '100%',
    gap: 0,
  },
  featureButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    marginHorizontal: 3, // Reduced gap
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    paddingVertical: '2%',
    paddingHorizontal: '1%',
  },
  featureButtonRanks: {
    backgroundColor: '#FFE5B4', // Light orange
    borderColor: '#FFA726', // Orange
    shadowColor: '#FFA726',
  },
  featureButtonProgress: {
    backgroundColor: '#FFEBEE', // Light red
    borderColor: '#E53935', // Red
    shadowColor: '#E53935',
  },
  featureButtonTracker: {
    backgroundColor: '#E8F5E9', // Light green
    borderColor: '#66BB6A', // Green
    shadowColor: '#66BB6A',
  },
  featureButtonCommunity: {
    backgroundColor: '#E3F2FD', // Light blue
    borderColor: '#1976D2', // Blue
    shadowColor: '#1976D2',
  },
  featureButtonSelected: {
    borderColor: '#FF9800', // Deeper orange accent for selected
    shadowColor: '#FF9800',
    shadowOpacity: 0.18,
    elevation: 4,
  },
  featureIcon: {
    fontSize: 24, // Slightly smaller
    marginBottom: 4,
    color: '#FF9800', // Orange accent
    textAlign: 'center',
  },
  featureLabel: {
    color: '#000000', // Orange text for theme
    fontSize: 12, // Slightly smaller
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15, // Adjusted for smaller font
  },
  carouselContainer: {
    marginTop: '2%',
    marginBottom: '2%',
    width: '100%',
    minHeight: '25%',
  },
  carouselContent: {
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 8,
  },
  bannerContainer: {
    backgroundColor: '#45B0A4',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: '#E08714',
    lineHeight: 22,
  },
  plansCarousel: {
    marginTop: 0, // Ensure no space above the carousel
    marginBottom: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  plansCarouselContent: {
    flexDirection: 'row',
    // Removed paddingLeft: '5%', // Rely on mainContainer's padding
    paddingTop: 0,
    paddingBottom: 0,
  },
  planContainer: {
    backgroundColor: '#45B0A4',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'flex-start', // Align text to the left inside the card
    height: 170,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  planText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff', // White text for better contrast on the background
    marginBottom: 5, // Add some space below the title
  },
  // New styles for Burn Calories section
  burnCaloriesContainer: {
    marginBottom: 0, // Ensure no extra space below this container
    // Removed paddingHorizontal: '5%', // Rely on mainContainer's padding
  },
  burnCaloriesHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 5,
  },
  burnCaloriesDescription: {
    fontSize: 14,
    color: '#333333', // Slightly lighter color for description
    lineHeight: 20,
    marginBottom: 32, // Further increase space below the description
    marginTop: 0,
    paddingVertical: 0,
    marginVertical: 0,
  },
  // New styles for Fitness Metrics section
  fitnessMetricsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  fitnessMetricsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    // Padding will be handled by mainContainer
  },
  fitnessMetricsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000', // Black text
  },
  fitnessMetricsSeeAll: {
    fontSize: 14,
    color: '#007BFF', // Blue color for link
  },
  metricsCarousel: {
    // No specific styles needed here, content styles handle layout
  },
  metricsCarouselContent: {
    flexDirection: 'row',
    // Padding will be handled by mainContainer for the first item alignment
  },
  metricCard: {
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 150, // Fixed width for cards
    height: 180, // Fixed height for cards
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  scoreCard: {
    backgroundColor: '#FFA726', // Orange background from image
  },
  hydrationCard: {
    backgroundColor: '#2196F3', // Blue background from image
  },
  caloriesCard: {
    backgroundColor: '#757575', // Grey background from image
  },
  metricCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff', // White text for contrast
  },
  chartPlaceholder: {
    flex: 1, // Take available space
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Semi-transparent white placeholder
    borderRadius: 5,
    marginVertical: 5,
  },
   circlesPlaceholder: {
     width: 20,
     height: 60, // Adjust height to match circles in image
     // backgroundColor: 'rgba(255, 255, 255, 0.3)', // No background needed for the container
     borderRadius: 10, // Make it circular
     justifyContent: 'space-around', // Distribute circles vertically
     alignItems: 'center', // Center circles horizontally
     paddingVertical: 5, // Add some vertical padding inside
     flexDirection: 'column', // Stack circles vertically
  },
  // Removed: Style for the individual circle dots
  /*
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // White dots
    marginBottom: 4, // Space between dots
  },
  */
  metricCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff', // White text
  },
  // New styles for chart visualizations
  barChartContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end', // Align bars to the bottom
    justifyContent: 'space-around', // Distribute space around bars
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  bar: {
    width: 10, // Width of each bar
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // White bars
    borderRadius: 2,
  },
  lineGraphContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 5,
    position: 'relative', // Needed for absolute positioning of lines
  },
  // Removed: lineGraphLine style
  
  // New styles for the two lines
  goalLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent white for goal
    transform: [{ rotate: '-5deg' }], // Example slight upward angle
    top: '30%', // Position the line higher
  },
  userInputLine: {
    position: 'absolute',
    width: '90%',
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 1)', // Opaque white for user input
    transform: [{ rotate: '5deg' }], // Example slight upward angle, different from goal
    top: '60%', // Position the line lower
  },
  // New styles for the progress bar visualization
  progressBarContainer: {
    width: '100%',
    height: 8, // Thickness of the progress bar
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // Light track
    borderRadius: 4,
    marginVertical: 10,
    overflow: 'hidden', // Clip the fill to the rounded corners
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFA726', // Orange fill color (example)
    borderRadius: 4,
  },
});

export default App;

