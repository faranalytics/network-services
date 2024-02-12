# Test

Run the tests using the following instructions.

## Instructions

### Clone the Network-Services repo.
```bash
git clone https://github.com/faranalytics/network-services.git
```
### Change directory into the root directory.
```bash
cd network-services
```
### Run the tests.
```bash
npm test
```
#### Output
```bash

▶ Test variations of uni-directional and bi-directional methods calls.
  ✔ Call a method that echos a string. (193.421171ms)
  ✔ Call a nested method and echo a string. (159.820272ms)
  ✔ Call a nested method that is defined in the super class and echo a string. (158.289753ms)
  ✔ Call a method that echos multiple arguments as an array of the arguments. (399.469235ms)
  ✔ Call echoString multiple times synchronously and asynchronously await their results. (352.722394ms)
  ✔ Call a method that bi-directionally calls another method. (2.557123ms)
  ✔ Call a method that throws an error. (2.42737ms)
  ✔ Call a method that bi-directionally calls another method that throws an Error. (1.81943ms)
  ✔ Call a nested method that throws an Error. (0.830841ms)
  ✔ Call a method that is not a defined property path. (1.21219ms)
  ✔ Call an undefined method. (0.7649ms)
  ✔ Call a method on a function object. (0.485425ms)
  ✔ Make a call that exceeds the queue size limit. (74.144076ms)
▶ Test variations of uni-directional and bi-directional methods calls. (1359.106793ms)

▶ Test bi-directional calls over a stream.Duplex in object mode.
  ✔ Call a method that bi-directionally calls another method. (5.055961ms)
▶ Test bi-directional calls over a stream.Duplex in object mode. (7.654073ms)

ℹ tests 14
ℹ suites 2
ℹ pass 14
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1607.8243
```