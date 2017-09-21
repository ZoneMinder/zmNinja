<a name="1.0.2"></a>
### 1.0.2

* [BUG] Allow transitions to same state with different parameters <https://github.com/shprink/ionic-native-transitions/pull/126>

<a name="1.0.1"></a>
### 1.0.1

* [BUG] Transition direction is wrong when using native-ui-sref <https://github.com/shprink/ionic-native-transitions/issues123>

<a name="1.0.0"></a>
### 1.0.0

* [BUG] Default back transition takes over the state transition <https://github.com/shprink/ionic-native-transitions/issues/105>
* [BUG] Same state transition with reload flag not possible <https://github.com/shprink/ionic-native-transitions/issues/119>

#### Breaking changes

* `stateGo` arguments order changed to match UI Route `go` arguments:

from:

```
# * @param {string|null} state                default:null
# * @param {object}      stateParams          default:{}
# * @param {object|null} transitionOptions    default:null
# * @param {object}      stateOptions         default:{}
```

to:

```
# * @param {string|null} state                default:null
# * @param {object}      stateParams          default:{}
# * @param {object}      stateOptions         default:{}
# * @param {object|null} transitionOptions    default:null
```

<a name="1.0.0-rc11"></a>
### 1.0.0-rc11

* [BUG] The transition is not right on IOS with Ionic 1.3.0 <https://github.com/shprink/ionic-native-transitions/issues/97>

<a name="1.0.0-rc10"></a>
### 1.0.0-rc10

* [FEATURE] Add onBefore transition event <https://github.com/shprink/ionic-native-transitions/issues/74>
* [BUG] Prevent same state transition when using stateGo function <https://github.com/shprink/ionic-native-transitions/issues/75>

<a name="1.0.0-rc9"></a>
### 1.0.0-rc9

* [BUG] stateGo API change <https://github.com/shprink/ionic-native-transitions/issues/35>
* [BUG] Hardware back does not close app <https://github.com/shprink/ionic-native-transitions/issues/47>
* [BUG] Pass `backCount` parameter to `$ionicNativeTransitions.goBack()` method <https://github.com/shprink/ionic-native-transitions/issues/53>

<a name="1.0.0-rc8"></a>
### 1.0.0-rc8

* [Enhancement] stateGo API change <https://github.com/shprink/ionic-native-transitions/issues/35>

<a name="1.0.0-rc7"></a>
### 1.0.0-rc7

* [Enhancement] Adding backCount to goBack(<backCount>) method <https://github.com/shprink/ionic-native-transitions/pull/56>

<a name="1.0.0-rc6"></a>
### 1.0.0-rc6

* [BUGFIX] Screen stuck after $stateChangeStart is defaultPrevented <https://github.com/shprink/ionic-native-transitions/issues/45>

<a name="1.0.0-rc5"></a>
### 1.0.0-rc5

* [BUGFIX] Correct back button behavior <https://github.com/shprink/ionic-native-transitions/issues/39>

<a name="1.0.0-rc3"></a>
### 1.0.0-rc3

* [FEATURE] Opposite transition on back button (backInOppositeDirection: true) <https://github.com/shprink/ionic-native-transitions/issues/27>
* [FEATURE] Back transition per state <https://github.com/shprink/ionic-native-transitions/issues/28>

<a name="1.0.0-rc2"></a>
### 1.0.0-rc2

* [BUGFIX] Hardware back button now closes Modal, Menu or Action Sheet before transition. <https://github.com/shprink/ionic-native-transitions/issues/32>

<a name="1.0.0-rc1"></a>
### 1.0.0-rc1

[milestone](https://github.cohttps://github.com/shprink/ionic-native-transitions/milestones/1.0.0)

* [FEATURE] Enable/Disable as a service <https://github.com/shprink/ionic-native-transitions/issues/22>
* [FEATURE] How to know that the transition ended? <https://github.com/shprink/ionic-native-transitions/issues/17>
* [FEATURE] How can I use it with $location.url() ? <https://github.com/shprink/ionic-native-transitions/issues/9>
* [FEATURE] Animate too early or too late enhancement <https://github.com/shprink/ionic-native-transitions/issues/3>
